import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_EVALUATION_MODEL || "gpt-5.6";
const execFileAsync = promisify(execFile);

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

const score = { type: "integer", minimum: 0, maximum: 100 };
const AUDIT_SCHEMA = {
  type: "object",
  properties: {
    approved: { type: "boolean" }, overall: score, importance: score, depth: score,
    insight: score, evidence: score, clarity: score, captivating: score, substance: score,
    deception: score, confidence: score,
    thesis: { type: "string" }, reasons: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
    weaknesses: { type: "array", items: { type: "string" }, maxItems: 4 },
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

export async function auditContent({ kind, title, content, context = "" }) {
  const normalized = String(content || "").replace(/\s+/g, " ").trim();
  if (normalized.length < minimumContentLength(kind)) return unavailable("Conteúdo insuficiente para uma avaliação responsável.");
  if (!OPENAI_API_KEY) return unavailable("Configure OPENAI_API_KEY para executar a auditoria semântica.");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "system", content: CONTENT_AUDIT_PROMPT },
        { role: "user", content: `TIPO: ${kind}\nTÍTULO: ${title}\nCONTEXTO NEUTRO: ${context}\n\nCONTEÚDO PARA AUDITORIA:\n${normalized.slice(0, 90_000)}` },
      ],
      text: { format: { type: "json_schema", name: "content_quality_audit", strict: true, schema: AUDIT_SCHEMA } },
      max_output_tokens: 1400,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI audit: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const outputText = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!outputText) throw new Error("OpenAI audit: resposta sem output_text");
  const audit = JSON.parse(outputText);
  const thresholdsPass = audit.overall >= 78 && audit.depth >= 72 && audit.insight >= 70 && audit.evidence >= 65 && audit.substance >= 75 && audit.deception <= 20;
  return { ...audit, approved: Boolean(audit.approved && thresholdsPass), method: "semantic-content", model: MODEL };
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
      "--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", "pt.*,en.*",
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
