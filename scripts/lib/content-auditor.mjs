import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = (process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
const MODEL = process.env.GROQ_EVALUATION_MODEL || "openai/gpt-oss-20b";
const execFileAsync = promisify(execFile);
const AUDIT_INTERVAL_MS = Math.max(0, Number(process.env.GROQ_AUDIT_INTERVAL_MS || 75_000));
let lastAuditRequestAt = 0;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  return Math.min(2 ** attempt * 2_000, 60_000);
}

function rateLimitError(label, body) {
  const error = new Error(`${label}: limite da Groq atingido; a fila continuará na próxima rodada. ${body}`);
  error.code = "GROQ_RATE_LIMIT";
  return error;
}

function httpError(label, status, body) {
  const error = new Error(`${label}: ${status} ${body}`);
  error.status = status;
  error.body = body;
  return error;
}

async function fetchGroq(path, options, label) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${GROQ_BASE_URL}${path}`, options);
    if (response.ok) return response;
    const body = await response.text();
    if (response.status === 429) {
      const wait = retryDelay(response, attempt);
      if (attempt === 0 && wait <= 120_000) {
        await delay(Math.max(5_000, wait));
        continue;
      }
      throw rateLimitError(label, body);
    }
    if (response.status < 500) throw httpError(label, response.status, body);
    if (attempt === 4) throw httpError(label, response.status, body);
    await delay(retryDelay(response, attempt));
  }
  throw new Error(`${label}: limite de tentativas excedido`);
}

async function paceAuditRequests() {
  const wait = AUDIT_INTERVAL_MS - (Date.now() - lastAuditRequestAt);
  if (wait > 0) await delay(wait);
  lastAuditRequestAt = Date.now();
}

export const CONTENT_AUDIT_PROMPT = `Você é o editor-chefe de uma biblioteca de formação exigente. Avalie exclusivamente o conteúdo fornecido, nunca o prestígio, tamanho, identidade ou reputação do canal, autor, podcast ou veículo.

Objetivo: aprovar somente materiais excepcionais, capazes de sustentar atenção sem manipulação e deixar o leitor ou espectador com modelos mentais, conexões ou perguntas melhores.

Critérios independentes, de 0 a 100:
1. importance: trata de algo consequente, durável ou útil para compreender/agir; novidade jornalística sozinha não basta.
2. depth: explica mecanismos, causas, consequências, limites e objeções; penalize resumo raso, lista e opinião alongada.
3. insight: produz conexões não óbvias ou muda a forma de pensar; penalize repetição de senso comum.
4. evidence: distingue fatos, inferências e opiniões; usa dados, exemplos verificáveis, fontes ou argumentação rastreável.
5. clarity: estrutura compreensível, definições precisas e progressão lógica, sem fingir certeza.
6. captivating: mantém interesse por tensão intelectual, narrativa, exemplos ou descoberta — nunca por choque, medo ou promessa inflada.
7. substance: proporção do material dedicada ao assunto; penalize introduções longas, autopromoção, repetição e enchimento.
8. deception: embalagem mais forte que o conteúdo, alegações sem sustentação, falsa profundidade ou certeza performática.

Regras de aprovação:
- Não compense falta de evidência com eloquência.
- Não presuma qualidade pelo nome citado nos metadados; a identidade da fonte foi deliberadamente omitida.
- Para notícia, exija consequência, contexto e explicação — não apenas o acontecimento.
- Para vídeo ou podcast, exija desenvolvimento real da tese e pelo menos um insight defensável.
- Rejeite se o texto disponível não representar conteúdo suficiente para avaliar.
- approved só pode ser true quando overall >= 78, depth >= 72, insight >= 70, evidence >= 65, substance >= 75 e deception <= 20.
- Responda no schema solicitado, com razões específicas ancoradas no conteúdo.`;

const score = { type: "integer" };
const AUDIT_SCHEMA = {
  type: "object",
  properties: {
    approved: { type: "boolean" }, overall: score, importance: score, depth: score,
    insight: score, evidence: score, clarity: score, captivating: score, substance: score,
    deception: score, confidence: score,
    thesis: { type: "string" }, reasons: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
  },
  required: ["approved", "overall", "importance", "depth", "insight", "evidence", "clarity", "captivating", "substance", "deception", "confidence", "thesis", "reasons", "weaknesses"],
  additionalProperties: false,
};

function unavailable(reason) {
  return { approved: false, overall: 0, importance: 0, depth: 0, insight: 0, evidence: 0, clarity: 0, captivating: 0, substance: 0, deception: 100, confidence: 100, thesis: "Conteúdo não auditado.", reasons: [], weaknesses: [reason], method: "unavailable", model: null };
}

export function minimumContentLength(kind) {
  return kind === "news" ? 1800 : 3500;
}

function representativeSample(content, maximumLength = 14_000) {
  if (content.length <= maximumLength) return content;
  const sections = 5;
  const sectionLength = Math.floor(maximumLength / sections);
  const lastStart = content.length - sectionLength;
  const excerpts = Array.from({ length: sections }, (_, index) => {
    const approximateStart = Math.floor((lastStart * index) / (sections - 1));
    const start = index === 0 ? 0 : Math.max(0, content.lastIndexOf(" ", approximateStart));
    const end = index === sections - 1 ? content.length : content.indexOf(" ", start + sectionLength);
    return content.slice(start, end > start ? end : start + sectionLength).trim();
  });
  return excerpts.map((excerpt, index) => `[TRECHO ${index + 1} DE ${sections}] ${excerpt}`).join("\n\n");
}

export async function auditContent({ kind, title, content, context = "" }) {
  const normalized = String(content || "").replace(/\s+/g, " ").trim();
  if (normalized.length < minimumContentLength(kind)) return unavailable("Conteúdo insuficiente para uma avaliação responsável.");
  if (!GROQ_API_KEY) return unavailable("Configure GROQ_API_KEY para executar a auditoria semântica.");

  const messages = [
    { role: "system", content: CONTENT_AUDIT_PROMPT },
    { role: "user", content: `TIPO: ${kind}\nTÍTULO: ${title}\nCONTEXTO NEUTRO: ${context}\n\nCONTEÚDO PARA AUDITORIA (amostra distribuída por toda a obra):\n${representativeSample(normalized)}\n\nResponda somente com um objeto JSON. Campos obrigatórios: approved, overall, importance, depth, insight, evidence, clarity, captivating, substance, deception, confidence, thesis, reasons e weaknesses.` },
  ];
  const requestAudit = async (responseFormat, label) => {
    await paceAuditRequests();
    return fetchGroq("/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${GROQ_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, response_format: responseFormat, max_completion_tokens: 1400, reasoning_effort: "low" }),
    }, label);
  };

  let response;
  try {
    response = await requestAudit({ type: "json_schema", json_schema: { name: "content_quality_audit", strict: true, schema: AUDIT_SCHEMA } }, "Groq audit");
  } catch (error) {
    if (error?.status !== 400 || !String(error.body || "").includes("json_validate_failed")) throw error;
    response = await requestAudit({ type: "json_object" }, "Groq audit fallback");
  }
  const data = await response.json();
  const outputText = data.choices?.[0]?.message?.content;
  if (!outputText) throw new Error("Groq audit: resposta sem conteúdo");
  const audit = JSON.parse(outputText);
  const scores = [audit.overall, audit.importance, audit.depth, audit.insight, audit.evidence, audit.clarity, audit.captivating, audit.substance, audit.deception, audit.confidence];
  if (typeof audit.approved !== "boolean" || typeof audit.thesis !== "string" || !Array.isArray(audit.reasons) || !Array.isArray(audit.weaknesses) || scores.some((value) => !Number.isInteger(value) || value < 0 || value > 100)) throw new Error("Groq audit: JSON retornado fora do contrato esperado");
  audit.reasons = audit.reasons.slice(0, 4);
  audit.weaknesses = audit.weaknesses.slice(0, 4);
  const thresholdsPass = audit.overall >= 78 && audit.depth >= 72 && audit.insight >= 70 && audit.evidence >= 65 && audit.substance >= 75 && audit.deception <= 20;
  return { ...audit, approved: Boolean(audit.approved && thresholdsPass), method: "semantic-content", provider: "groq", model: MODEL };
}

function parseJsonArrayAfter(html, marker) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = html.indexOf("[", markerIndex + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (escaped) { escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (quoted) continue;
    if (char === "[") depth += 1;
    if (char === "]" && --depth === 0) return html.slice(start, index + 1);
  }
  return null;
}

export async function fetchYouTubeTranscript(videoId) {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: { "user-agent": "Mozilla/5.0", "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" } });
  if (!response.ok) return "";
  const html = await response.text();
  const rawTracks = parseJsonArrayAfter(html, '"captionTracks":');
  if (!rawTracks) return fetchYouTubeTranscriptWithYtDlp(videoId);
  let tracks;
  try { tracks = JSON.parse(rawTracks); } catch { return fetchYouTubeTranscriptWithYtDlp(videoId); }
  const track = tracks.find((item) => /pt|en/i.test(item.languageCode || "")) || tracks[0];
  if (!track?.baseUrl) return fetchYouTubeTranscriptWithYtDlp(videoId);
  const transcriptResponse = await fetch(`${track.baseUrl}&fmt=json3`);
  if (!transcriptResponse.ok) return fetchYouTubeTranscriptWithYtDlp(videoId);
  const transcript = await transcriptResponse.json().catch(() => null);
  const text = (transcript?.events || []).flatMap((event) => event.segs || []).map((segment) => segment.utf8 || "").join(" ").replace(/\s+/g, " ").trim();
  return text || fetchYouTubeTranscriptWithYtDlp(videoId);
}

async function fetchYouTubeTranscriptWithYtDlp(videoId) {
  const directory = await mkdtemp(join(tmpdir(), "clarity-captions-"));
  try {
    const executable = process.env.YTDLP_PATH || "yt-dlp";
    await execFileAsync(executable, [
      "--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", "pt,en",
      "--sub-format", "json3", "--no-playlist", "-o", join(directory, "%(id)s.%(ext)s"),
      `https://www.youtube.com/watch?v=${videoId}`,
    ], { timeout: 120_000, maxBuffer: 2_000_000 });
    const files = (await readdir(directory)).filter((file) => file.endsWith(".json3"));
    if (!files.length) return "";
    const preferred = files.find((file) => /\.pt(?:-|\.)/i.test(file)) || files.find((file) => /\.en(?:-|\.)/i.test(file)) || files[0];
    const transcript = JSON.parse(await readFile(join(directory, preferred), "utf8"));
    return (transcript?.events || []).flatMap((event) => event.segs || []).map((segment) => segment.utf8 || "").join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export function htmlToText(html = "") {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
}

export async function transcribeAudioUrl(audioUrl) {
  if (!GROQ_API_KEY || !audioUrl) return "";
  const directory = await mkdtemp(join(tmpdir(), "clarity-audio-"));
  const outputPattern = join(directory, "chunk-%03d.mp3");
  try {
    await execFileAsync(process.env.FFMPEG_PATH || "ffmpeg", [
      "-y", "-i", audioUrl, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "16k", "-t", "10800",
      "-f", "segment", "-segment_time", "300", "-reset_timestamps", "1", outputPattern,
    ], { timeout: 900_000, maxBuffer: 2_000_000 });
    const chunks = (await readdir(directory)).filter((file) => /^chunk-\d+\.mp3$/.test(file)).sort();
    if (!chunks.length) return "";
    const sampleCount = Math.min(4, chunks.length);
    const selected = Array.from({ length: sampleCount }, (_, index) => chunks[Math.round(index * (chunks.length - 1) / Math.max(1, sampleCount - 1))]);
    const transcripts = [];
    for (const [index, filename] of [...new Set(selected)].entries()) {
      const audio = await readFile(join(directory, filename));
      if (audio.length < 4_096 || audio.length > 8 * 1024 * 1024) continue;
      const body = new FormData();
      body.set("file", new Blob([audio], { type: "audio/mpeg" }), filename);
      body.set("model", process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo");
      body.set("response_format", "text");
      const response = await fetchGroq("/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${GROQ_API_KEY}` }, body }, "Groq transcription");
      const text = (await response.text()).trim();
      if (text) transcripts.push(`[TRECHO DE ÁUDIO ${index + 1}] ${text}`);
    }
    return transcripts.join("\n\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
