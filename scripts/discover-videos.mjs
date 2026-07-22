import { mkdir, readFile, writeFile } from "node:fs/promises";

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.log("Clarity: descoberta geral ignorada; configure YOUTUBE_API_KEY para ativá-la.");
  process.exit(0);
}

const topics = JSON.parse(await readFile(new URL("../config/discovery-topics.json", import.meta.url), "utf8"));
const batchSize = Math.max(1, Math.min(4, Number(process.env.DISCOVERY_BATCH_SIZE || 4)));
const startIndex = (new Date().getUTCHours() * batchSize) % topics.length;
const activeTopics = Array.from({ length: Math.min(batchSize, topics.length) }, (_, offset) => {
  const topicIndex = (startIndex + offset) % topics.length;
  return { topic: topics[topicIndex], topicIndex };
});
const palettes = ["blue", "coral", "ink", "moss", "violet", "sand"];
const shallowTitle = /#shorts|\bshorts?\b|cortes?\s+(do|de|podcast)|urgente|chocante|você não vai acreditar|ninguém te conta|segredo que|treta|destruiu|humilhou|lacrou|mitou|exposed|fique rico|ganhe dinheiro (fácil|rápido)|melhor(es)? que \d+%|\d+% dos/i;
const learningTitle = /aula|curso|explic|fundamento|document|palestra|análise|história|lecture|explained|documentary|strategy|science/i;
const evidenceSignal = /evidência|evidence|fontes|sources|referências|references|bibliografia|pesquisa|research|estudo de caso|case study|demonstração|demonstration|dados|data\b/i;
const DISCOVERY_PROMPTS = [
  { pt: "explicação completa conceitos exemplos", en: "complete explanation concepts examples" },
  { pt: "documentário análise com fontes", en: "documentary analysis with sources" },
  { pt: "fundamentos mecanismos demonstração", en: "fundamentals mechanisms demonstration" },
  { pt: "estudo de caso evidências", en: "case study evidence" },
];

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
  const promptIndex = (Math.floor(Date.now() / 3_600_000) + topicIndex) % DISCOVERY_PROMPTS.length;
  const prompt = DISCOVERY_PROMPTS[promptIndex];
  const discoveryPrompt = `${topic.query} ${topic.language === "en" ? prompt.en : prompt.pt}`;
  const search = await youtube("search", {
    part: "snippet", type: "video", maxResults: 25, order: "relevance", safeSearch: "moderate",
    videoEmbeddable: true, videoSyndicated: true, relevanceLanguage: topic.language, q: discoveryPrompt,
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
    const description = item.snippet?.description || "";
    const context = `${title} ${description}`;
    const learning = learningTitle.test(context) ? .06 : 0;
    const evidence = evidenceSignal.test(context) ? .09 : 0;
    const descriptionDepth = description.trim().length >= 280 ? .06 : description.trim().length >= 120 ? .03 : 0;
    const reception = views > 0 ? clamp((likes / views) * 10, 0, .06) : 0;
    const quality = clamp(.62 + learning + evidence + descriptionDepth + reception + durationDepth * .08);
    if (quality < .84) return null;
    return {
      id: `discover-${item.id}`, youtubeId: item.id, thumbnailId: item.id, embedType: "video",
      publishedAt: item.snippet.publishedAt, category: topic.category, title,
      channel: item.snippet.channelTitle, topic: topic.topic, url: `https://www.youtube.com/watch?v=${item.id}`,
      durationSeconds: seconds, depth: clamp(.6 + durationDepth * .25 + evidence), novelty: clamp(.9 - index * .025),
      quality, evergreen: topic.category === "Mundo" ? .68 : .84,
      publishedLabel: ageLabel(item.snippet.publishedAt), palette: palettes[(topicIndex + index) % palettes.length],
      mark: "DESCOBERTA",
    };
  }).filter(Boolean)
    .sort((a, b) => b.quality - a.quality || b.novelty - a.novelty)
    .slice(0, 8);
}

const settled = await Promise.allSettled(activeTopics.map(({ topic, topicIndex }) => discover(topic, topicIndex)));
const all = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
const videos = all
  .filter((video, index) => all.findIndex((item) => item.youtubeId === video.youtubeId) === index)
  .sort((a, b) => b.quality - a.quality || b.novelty - a.novelty);
if (!videos.length) {
  console.warn("Clarity: nenhuma descoberta aprovada; mantendo o arquivo publicado anteriormente.");
  process.exit(0);
}

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/data/discovered-videos.json", import.meta.url), `${JSON.stringify({ updatedAt: new Date().toISOString(), source: "YouTube Data API", strategy: "prompts rotativos com avaliação individual de qualidade", rotatingTopics: activeTopics.map(({ topic }) => topic.topic), videos }, null, 2)}\n`, "utf8");
console.log(`Clarity: ${videos.length} descobertas aprovadas por qualidade individual em ${activeTopics.length} pesquisas rotativas.`);
