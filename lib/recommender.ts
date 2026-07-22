import type { Video } from "./videos";

export type Preferences = {
  topics: string[];
  topicWeights: Record<string, number>;
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

export const DEFAULT_PREFERENCES: Preferences = {
  topics: ["filosofia", "natureza humana", "economia", "formação católica"],
  topicWeights: {},
  depth: 86,
  discovery: 52,
  evergreen: 90,
  maxMinutes: 48,
};

function closeness(value: number, target: number) {
  return 1 - Math.abs(value - target);
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
