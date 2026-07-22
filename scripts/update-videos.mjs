import { mkdir, readFile, writeFile } from "node:fs/promises";

const sources = [
  { channelId: "UCP6L9TPS3pHccVRiDB_cvqQ", category: "Fé", topic: "formação católica", quality: .97, depth: .9 },
  { channelId: "UCbh6_TmFnAJLI56aAQeD3qw", category: "Fé", topic: "vida espiritual", quality: .94, depth: .82 },
  { channelId: "UCGg-UqjRgzhYDPJMr-9HXCg", category: "Criação", topic: "estratégia de canal", quality: .92, depth: .8 },
  { channelId: "UCSQ6ebJE6MTrEAN_P-L-fuA", category: "Criação", topic: "roteiro e retenção", quality: .93, depth: .84 },
  { channelId: "UCamLstJyCa-t5gfZegxsFMw", category: "Criação", topic: "economia dos criadores", quality: .92, depth: .82 },
  { channelId: "UCxpP-CIol4wMrQPWcWf0ZjQ", category: "Criação", topic: "estratégia de canal", quality: .9, depth: .76 },
  { channelId: "UCLJkh3QjHsLtK0LZFd28oGg", category: "Negócios", topic: "economia", quality: .94, depth: .88 },
  { channelId: "UCOUPMC2xhebuIWxWfZeyJCg", category: "Negócios", topic: "gestão", quality: .91, depth: .82 },
  { channelId: "UCAMO_xP86YB4FSHD1Mi_GpA", category: "Ideias", topic: "filosofia", quality: .95, depth: .9 },
  { channelId: "UCkVBx-XpEXAgWHX5-P1hl-A", category: "Mundo", topic: "geopolítica", quality: .93, depth: .84 },
  { channelId: "UCnPW1aOwBnB7IO2wznXh62A", category: "Política", topic: "geopolítica", quality: .94, depth: .86 },
  { channelId: "UCJVTsYjG0KLNWL6OyHx7ZGw", category: "Política", topic: "instituições", quality: .93, depth: .82 },
  { channelId: "UCthbIFAxbXTTQEC7EcQvP1Q", category: "Política", topic: "política e sociedade", quality: .94, depth: .8 },
  { channelId: "UCkJ8uPxz6UvoI6ihgQJZnww", category: "Política", topic: "política internacional", quality: .92, depth: .78 },
  { channelId: "UCYO_jab_esuFRV4b17AJtAw", category: "Ciência", topic: "matemática", quality: .98, depth: .94 },
  { channelId: "UCHnyfMqiRRG1u-2MsSQLbXA", category: "Ciência", topic: "curiosidades", quality: .96, depth: .86 },
  { channelId: "UCsXVk37bltHxD1rDPwtNM8Q", category: "Ideias", topic: "natureza humana", quality: .97, depth: .78 },
  { channelId: "UCLXo7UDZvByw2ixzpQCufnA", category: "Mundo", topic: "geopolítica", quality: .91, depth: .76 },
  { channelId: "UCsooa4yRKGN_zEE8iknghZA", category: "Mundo", topic: "história", quality: .93, depth: .72 },
];

const palettes = ["sand", "moss", "coral", "blue", "violet", "ink"];
const shallowTitle = /#shorts|\bshorts?\b|cortes?\s+(do|de|podcast)|treta|fofoca|pegadinha/i;
const watchQueue = [];
let activeWatchRequests = 0;

async function fetchWatchPage(url) {
  if (activeWatchRequests >= 5) await new Promise((resolve) => watchQueue.push(resolve));
  activeWatchRequests += 1;
  try {
    return await fetch(url, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
  } finally {
    activeWatchRequests -= 1;
    watchQueue.shift()?.();
  }
}

function decodeXml(value = "") {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function valueOf(block, tag) {
  return decodeXml(block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))?.[1]?.trim() || "");
}

function publishedLabel(publishedAt) {
  const hours = Math.max(1, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 3_600_000));
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

async function fetchSource(source, sourceIndex) {
  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${source.channelId}`, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
  if (!response.ok) throw new Error(`Feed ${source.channelId}: ${response.status}`);
  const xml = await response.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 10);
  const videos = await Promise.all(entries.map(async (match, index) => {
    const block = match[1];
    const videoId = valueOf(block, "yt:videoId");
    const title = valueOf(block, "title");
    const channel = valueOf(block, "name");
    const publishedAt = valueOf(block, "published");
    if (shallowTitle.test(title)) return null;
    const page = await fetchWatchPage(`https://www.youtube.com/watch?v=${videoId}`);
    if (!page.ok) return null;
    const html = await page.text();
    const isShort = html.includes('"canonicalUrl":"https://www.youtube.com/shorts/');
    if (isShort) return null;
    const durationSeconds = Number(html.match(/"lengthSeconds":"(\d+)"/)?.[1] || 900);
    return {
      id: `latest-${videoId}`, youtubeId: videoId, thumbnailId: videoId, embedType: "video", publishedAt,
      category: source.category, title, channel, topic: source.topic, url: `https://www.youtube.com/watch?v=${videoId}`,
      durationSeconds, depth: source.depth, novelty: Math.max(.65, .95 - index * .06), quality: source.quality,
      evergreen: source.category === "Mundo" ? .7 : .88, publishedLabel: publishedLabel(publishedAt),
      palette: palettes[(sourceIndex + index) % palettes.length], mark: source.category.toUpperCase(),
    };
  }));
  return videos.filter((video) => video?.youtubeId && video?.title);
}

const settled = await Promise.allSettled(sources.map(fetchSource));
const refreshed = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
if (!refreshed.length) {
  console.warn("Clarity: os detalhes do YouTube estão temporariamente indisponíveis; mantendo o feed anterior.");
  process.exit(0);
}
let previous = [];
try {
  const data = JSON.parse(await readFile(new URL("../public/data/latest-videos.json", import.meta.url), "utf8"));
  previous = Array.isArray(data.videos) ? data.videos : [];
} catch {}
const merged = [...refreshed, ...previous].filter((video) => !shallowTitle.test(video.title || ""))
  .filter((video, index, all) => all.findIndex((item) => item.youtubeId === video.youtubeId) === index)
  .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
const channelCount = new Map();
const videos = merged.filter((video) => {
  const count = channelCount.get(video.channel) || 0;
  if (count >= 10) return false;
  channelCount.set(video.channel, count + 1);
  return true;
}).slice(0, 200);

const output = { updatedAt: new Date().toISOString(), source: "YouTube channel RSS", videos };
await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/data/latest-videos.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Clarity: ${refreshed.length} vídeos renovados; ${videos.length} mantidos no feed de ${settled.filter((item) => item.status === "fulfilled").length} canais.`);
