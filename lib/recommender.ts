import type { Video } from "./videos";

export type Preferences = {
  topics: string[];
  topicWeights: Record<string, number>;
  videoFeedback: Record<string, -1 | 1>;
  traitWeights: Record<string, number>;
  depth: number;
  discovery: number;
  evergreen: number;
  maxMinutes: number;
};

export type RankedVideo = Video & { score: number; explanation: string };

export type DiversityOptions = {
  scoreTolerance?: number;
  recentChannelWindow?: number;
};

const LOW_VALUE_TITLE = /\b(shorts?|cortes? (do|de) podcast|urgente|chocante|você não vai acreditar|voce nao vai acreditar|ninguém te conta|ninguem te conta|segredo que|destruiu|humilhou|lacrou|mitou|exposed|fique rico|ganhe dinheiro (fácil|facil|rápido|rapido)|melhor(es)? que \d+%|\d+% dos)\b/i;

export function videoRejectionReason(video: Video) {
  if (/youtube\.com\/shorts\//i.test(video.url)) return "Short do YouTube";
  if (!Number.isFinite(video.durationSeconds) || video.durationSeconds <= 0) return "duração não verificada";
  if (video.durationSeconds < 241) return "menos de quatro minutos";
  if (LOW_VALUE_TITLE.test(video.title)) return "título manipulativo ou superficial";
  if (video.quality < .84) return "qualidade insuficiente";
  if (video.depth < .58) return "profundidade insuficiente";
  return null;
}

export const DEFAULT_PREFERENCES: Preferences = {
  topics: ["filosofia", "natureza humana", "economia", "formação católica"],
  topicWeights: {},
  videoFeedback: {},
  traitWeights: {},
  depth: 86,
  discovery: 52,
  evergreen: 90,
  maxMinutes: 48,
};

function closeness(value: number, target: number) {
  return 1 - Math.abs(value - target);
}

export function feedbackTraits(video: Video) {
  const depth = video.depth < .68 ? "fundamentos" : video.depth < .86 ? "intermediário" : "profundo";
  const minutes = video.durationSeconds / 60;
  const duration = minutes <= 15 ? "curto" : minutes <= 45 ? "médio" : "longo";
  return [`category:${video.category}`, `depth:${depth}`, `duration:${duration}`];
}

export function scoreVideo(video: Video, preferences: Preferences) {
  const depthFit = closeness(video.depth, preferences.depth / 100);
  const evergreenFit = video.evergreen * (preferences.evergreen / 100);
  const isPreferredTopic = preferences.topics.includes(video.topic);
  const discoveryFactor = preferences.discovery / 100;
  const topicFit = isPreferredTopic ? 1 - discoveryFactor * .25 : discoveryFactor * .9;
  const durationMinutes = video.durationSeconds / 60;
  const durationFit = durationMinutes <= preferences.maxMinutes ? 1 : Math.max(0, 1 - (durationMinutes - preferences.maxMinutes) / 60);
  const feedback = preferences.topicWeights[video.topic] ?? 0;
  const directFeedback = preferences.videoFeedback?.[video.youtubeId] ?? 0;
  const traitFeedback = feedbackTraits(video).reduce((total, trait) => total + (preferences.traitWeights?.[trait] ?? 0), 0);
  const ageDays = video.publishedAt ? Math.max(0, (Date.now() - new Date(video.publishedAt).getTime()) / 86_400_000) : 365;
  const freshness = Math.max(0, 1 - ageDays / 45);

  return (
    video.quality * 32 +
    depthFit * 20 +
    evergreenFit * 18 +
    topicFit * 16 +
    durationFit * 10 +
    video.novelty * discoveryFactor * 8 +
    feedback * 4 +
    directFeedback * 14 +
    traitFeedback * 2 +
    freshness * (preferences.discovery / 100) * 8
  );
}

function explain(video: Video, preferences: Preferences) {
  const reasons: string[] = [];
  if (preferences.topics.includes(video.topic)) reasons.push(`combina com seu interesse em ${video.topic}`);
  if (video.depth > .8) reasons.push("vai além do básico");
  if (video.evergreen > .95) reasons.push("continua relevante com o tempo");
  if (!preferences.topics.includes(video.topic)) reasons.push("traz uma perspectiva fora da sua bolha");
  if (video.durationSeconds / 60 <= preferences.maxMinutes) reasons.push("cabe no tempo que você definiu");
  return reasons.slice(0, 2).join(" e ") + ".";
}

export function rankVideos(videos: Video[], preferences: Preferences): RankedVideo[] {
  return videos
    .map((video) => ({ ...video, score: scoreVideo(video, preferences), explanation: explain(video, preferences) }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

/**
 * Alterna canais somente entre vídeos com notas praticamente equivalentes.
 * O canal nunca altera a nota nem elimina um vídeo da seleção.
 */
export function diversifyVideos(videos: RankedVideo[], options: DiversityOptions = {}) {
  if (videos.length < 2) return videos;

  const remaining = [...videos];
  const selected: RankedVideo[] = [];
  const scoreTolerance = options.scoreTolerance ?? 2.5;
  const recentChannelWindow = options.recentChannelWindow ?? 5;

  while (remaining.length) {
    const recentChannels = new Set(selected.slice(-recentChannelWindow).map((video) => video.channel));
    const minimumEquivalentScore = remaining[0].score - scoreTolerance;
    const diverseIndex = remaining.findIndex((video) => video.score >= minimumEquivalentScore && !recentChannels.has(video.channel));
    const [chosen] = remaining.splice(diverseIndex < 0 ? 0 : diverseIndex, 1);
    selected.push(chosen);
  }

  return selected;
}
