import { mkdir, readFile, writeFile } from "node:fs/promises";
import { auditContent, fetchYouTubeTranscript, htmlToText, transcribeAudioUrl } from "./lib/content-auditor.mjs";

if (!process.env.GROQ_API_KEY) {
  console.warn("Clarity: auditoria profunda ignorada; configure GROQ_API_KEY para aprovar conteúdo.");
  process.exit(0);
}

const outputUrl = new URL("../public/data/content-audits.json", import.meta.url);
const perKindLimit = Math.max(1, Math.min(20, Number(process.env.CONTENT_AUDIT_BATCH_SIZE || 6)));
const podcastLimit = Math.max(1, Math.min(3, Number(process.env.PODCAST_AUDIT_BATCH_SIZE || 1)));

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")); } catch { return fallback; }
}

const [latest, discovered, newsData, podcastData, seedSource, previous] = await Promise.all([
  readJson("../public/data/latest-videos.json", { videos: [] }),
  readJson("../public/data/discovered-videos.json", { videos: [] }),
  readJson("../public/data/news.json", { news: [] }),
  readJson("../public/data/podcasts.json", { podcasts: [] }),
  readFile(new URL("../lib/videos.ts", import.meta.url), "utf8"),
  readJson("../public/data/content-audits.json", { audits: {} }),
]);

const seedVideos = [...seedSource.matchAll(/youtubeId: "([^"]+)"[^\n]*?title: "([^"]+)"/g)].map((match) => ({ youtubeId: match[1], title: match[2], category: "acervo-base" }));
const videos = [...(latest.videos || []), ...(discovered.videos || []), ...seedVideos]
  .filter((item, index, all) => item.youtubeId && all.findIndex((candidate) => candidate.youtubeId === item.youtubeId) === index);
const audits = { ...(previous.audits || {}) };
const now = new Date().toISOString();

async function auditVideo(video) {
  const key = `video:${video.youtubeId}`;
  if (audits[key]?.method === "semantic-content") return false;
  const transcript = await fetchYouTubeTranscript(video.youtubeId);
  const result = await auditContent({ kind: "video", title: video.title, content: transcript, context: `Tema: ${video.topic || video.category || "não informado"}` });
  audits[key] = { ...result, auditedAt: now };
  return result.method === "semantic-content";
}

async function auditNews(item) {
  const key = `news:${item.url}`;
  if (audits[key]?.method === "semantic-content") return false;
  let text = "";
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`"${item.title}" ${item.source || ""}`)}`;
    const searchResponse = await fetch(searchUrl, { headers: { "user-agent": "Mozilla/5.0" } });
    const searchHtml = searchResponse.ok ? await searchResponse.text() : "";
    const resultUrls = [...searchHtml.matchAll(/result__a[^>]+href="([^"]+)"/g)].map((match) => {
      const href = match[1].replaceAll("&amp;", "&");
      try { return new URL(href.startsWith("//") ? `https:${href}` : href).searchParams.get("uddg") || href; } catch { return href; }
    }).filter((url, index, all) => /^https?:/i.test(url) && !/google\.com|duckduckgo\.com/i.test(url) && all.indexOf(url) === index).slice(0, 5);
    for (const url of resultUrls) {
      const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } }).catch(() => null);
      if (!response?.ok) continue;
      const candidate = htmlToText(await response.text());
      if (candidate.length >= 1800) { text = candidate; break; }
    }
  } catch {}
  const result = await auditContent({ kind: "news", title: item.title, content: text, context: `Categoria: ${item.category || "notícia"}; publicação: ${item.publishedAt || "não informada"}` });
  audits[key] = { ...result, auditedAt: now };
  return result.method === "semantic-content";
}

function xmlValue(block, tag) {
  return block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))?.[1]?.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() || "";
}

async function podcastTranscript(feedUrl) {
  if (!feedUrl) return { title: "", text: "" };
  const response = await fetch(feedUrl, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
  if (!response.ok) return { title: "", text: "" };
  const xml = await response.text();
  const item = xml.match(/<item>([\s\S]*?)<\/item>/i)?.[1] || "";
  const title = htmlToText(xmlValue(item, "title"));
  const transcriptUrl = item.match(/<podcast:transcript[^>]+url=["']([^"']+)/i)?.[1]?.replaceAll("&amp;", "&");
  if (transcriptUrl) {
    const transcriptResponse = await fetch(transcriptUrl, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
    if (transcriptResponse.ok) return { title, text: htmlToText(await transcriptResponse.text()) };
  }
  const audioUrl = item.match(/<enclosure[^>]+url=["']([^"']+)/i)?.[1]?.replaceAll("&amp;", "&");
  return { title, text: await transcribeAudioUrl(audioUrl) };
}

async function auditPodcast(item) {
  const key = `podcast:${item.appleId}`;
  const existingAge = Date.now() - Date.parse(audits[key]?.auditedAt || 0);
  if (audits[key] && existingAge < 14 * 86_400_000) return false;
  let episode = { title: "", text: "" };
  try { episode = await podcastTranscript(item.feedUrl); } catch {}
  const result = await auditContent({ kind: "podcast", title: episode.title || item.title, content: episode.text, context: "Episódio mais recente com transcrição publicada." });
  audits[key] = { ...result, auditedAt: now, episodeTitle: episode.title };
  return result.method === "semantic-content";
}

async function runBatch(items, audit, limit = perKindLimit) {
  let processed = 0;
  for (const item of items) {
    if (processed >= limit) break;
    try { if (await audit(item)) processed += 1; } catch (error) { console.warn(`Clarity audit: ${error instanceof Error ? error.message : error}`); }
  }
  return processed;
}

// Executar em série evita estourar o limite de tokens por minuto do plano gratuito.
const videoCount = await runBatch(videos, auditVideo);
const newsCount = await runBatch(newsData.news || [], auditNews);
const podcastCount = await runBatch(podcastData.podcasts || [], auditPodcast, podcastLimit);

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(outputUrl, `${JSON.stringify({ updatedAt: now, provider: "groq", model: process.env.GROQ_EVALUATION_MODEL || "openai/gpt-oss-20b", promptVersion: 2, audits }, null, 2)}\n`, "utf8");
console.log(`Clarity: auditoria profunda processou ${videoCount} vídeos, ${newsCount} notícias e ${podcastCount} podcasts.`);
