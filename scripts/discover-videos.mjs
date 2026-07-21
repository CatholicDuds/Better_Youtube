import { mkdir, readFile, writeFile } from "node:fs/promises";

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.log("Clarity: descoberta geral ignorada; configure YOUTUBE_API_KEY para ativá-la.");
  process.exit(0);
}

const topics = JSON.parse(await readFile(new URL("../config/discovery-topics.json", import.meta.url), "utf8"));
const batchSize = Math.max(1, Math.min(4, Number(process.env.DISCOVERY_BATCH_SIZE || 2)));
const startIndex = (new Date().getUTCHours() * batchSize) % topics.length;
const activeTopics = Array.from({ length: Math.min(batchSize, topics.length) }, (_, offset) => {
  const topicIndex = (startIndex + offset) % topics.length;
  return { topic: topics[topicIndex], topicIndex };
});
const palettes = ["blue", "coral", "ink", "moss", "violet", "sand"];
const shallowTitle = /#shorts|\bshorts?\b|cortes?\s+(do|de|podcast)|urgente|chocante|você não vai acreditar|treta/i;
const learningTitle = /aula|curso|explic|fundamento|document|palestra|análise|história|lecture|explained|documentary|strategy|science/i;

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function durationSeconds(iso = "PT0S") {
  const match = iso.match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0);
}

function ageLabel(publishedAt) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000));
  if (days === 0) return "publicado hoje";
  if (days < 30) return `há ${days} dias`;
  if (days < 365) return `há ${Math.floor(days / 30)} meses`;
  const years = Math.floor(days / 365);
  return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}

async function youtube(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries({ ...params, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`YouTube ${endpoint}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function discover(topic, topicIndex) {
  const search = await youtube("search", {
    part: "snippet", type: "video", maxResults: 25, order: "relevance", safeSearch: "moderate",
    videoEmbeddable: true, videoSyndicated: true, relevanceLanguage: topic.language, q: topic.query,
  });
  const ids = search.items?.map((item) => item.id?.videoId).filter(Boolean) || [];
  if (!ids.length) return [];
  const details = await youtube("videos", { part: "snippet,contentDetails,statistics,status", id: ids.join(",") });
  return (details.items || []).map((item, index) => {
    const seconds = durationSeconds(item.contentDetails?.duration);
    const title = item.snippet?.title || "";
    if (seconds < 241 || seconds > 10_800 || shallowTitle.test(title) || item.snippet?.liveBroadcastContent !== "none" || !item.status?.embeddable) return null;
    const views = Number(item.statistics?.viewCount || 0);
    const likes = Number(item.statistics?.likeCount || 0);
    const durationDepth = clamp((seconds - 240) / 3300);
    const evidence = learningTitle.test(title) ? .09 : 0;
    const reception = views > 0 ? clamp((likes / views) * 14, 0, .08) : 0;
    return {
      id: `discover-${item.id}`, youtubeId: item.id, thumbnailId: item.id, embedType: "video",
      publishedAt: item.snippet.publishedAt, category: topic.category, title,
      channel: item.snippet.channelTitle, topic: topic.topic, url: `https://www.youtube.com/watch?v=${item.id}`,
      durationSeconds: seconds, depth: clamp(.62 + durationDepth * .25 + evidence), novelty: clamp(.86 - index * .035),
      quality: clamp(.72 + evidence + reception), evergreen: topic.category === "Mundo" ? .68 : .84,
      publishedLabel: ageLabel(item.snippet.publishedAt), palette: palettes[(topicIndex + index) % palettes.length],
      mark: "DESCOBERTA",
    };
  }).filter(Boolean).slice(0, 8);
}

const settled = await Promise.allSettled(activeTopics.map(({ topic, topicIndex }) => discover(topic, topicIndex)));
const all = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
const videos = all.filter((video, index) => all.findIndex((item) => item.youtubeId === video.youtubeId) === index);
if (!videos.length) {
  console.warn("Clarity: nenhuma descoberta aprovada; mantendo o arquivo publicado anteriormente.");
  process.exit(0);
}

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/data/discovered-videos.json", import.meta.url), `${JSON.stringify({ updatedAt: new Date().toISOString(), source: "YouTube Data API", rotatingTopics: activeTopics.map(({ topic }) => topic.topic), videos }, null, 2)}\n`, "utf8");
console.log(`Clarity: ${videos.length} descobertas aprovadas em ${activeTopics.length} pesquisas rotativas de ${topics.length} assuntos.`);
