import type { Video } from "./videos";
import { hasSemanticScores, type ContentAudit, type AuditMap } from "./content-audits";
import { activeGoals, normalizeTopicWeights, topicId, topicLabel } from "./topics";

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

export function videoStructuralRejectionReason(video: Video) {
  if (/youtube\.com\/shorts\//i.test(video.url)) return "Short do YouTube";
  if (!Number.isFinite(video.durationSeconds) || video.durationSeconds <= 0) return "duração não verificada";
  if (video.durationSeconds < 241) return "menos de quatro minutos";
  return null;
}

export function videoRejectionReason(video: Video) {
  const structuralReason = videoStructuralRejectionReason(video);
  if (structuralReason) return structuralReason;
  if (LOW_VALUE_TITLE.test(video.title)) return "título manipulativo ou superficial";
  if (video.quality < .84) return "qualidade insuficiente";
  if (video.depth < .58) return "profundidade insuficiente";
  return null;
}

export const DEFAULT_PREFERENCES: Preferences = {
  topics: ["filosofia", "natureza-humana", "economia", "formacao-catolica"],
  topicWeights: {},
  videoFeedback: {},
  traitWeights: {},
  depth: 86,
  discovery: 52,
  evergreen: 90,
  maxMinutes: 48,
};

function closeness(value: number, target: number) {
  return Math.max(0, 1 - Math.abs(value - target));
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));

export function auditedVideo(video: Video, audit?: ContentAudit): Video {
  return { ...video, topic: topicId(video.topic), quality: hasSemanticScores(audit) ? audit!.overall / 100 : 0, depth: hasSemanticScores(audit) ? audit!.depth / 100 : 0 };
}

export function feedbackTraits(video: Video) {
  const depth = video.depth < .68 ? "fundamentos" : video.depth < .86 ? "intermediário" : "profundo";
  const minutes = video.durationSeconds / 60;
  const duration = minutes <= 0 ? "desconhecido" : minutes <= 15 ? "curto" : minutes <= 45 ? "médio" : "longo";
  return [`category:${video.category}`, `depth:${depth}`, `duration:${duration}`];
}

export function scoreVideo(video: Video, preferences: Preferences, audit?: ContentAudit) {
  // No heuristic fallback: unaudited library items have no editorial score.
  if (!hasSemanticScores(audit)) return 0;
  const evaluated = auditedVideo(video, audit);
  const depthFit = closeness(evaluated.depth, preferences.depth / 100);
  const evergreenFit = clamp(video.evergreen) * clamp(preferences.evergreen / 100);
  const isPreferredTopic = preferences.topics.some((topic) => topicId(topic) === evaluated.topic);
  const goalWeight = Math.max(0, ...activeGoals.filter((goal) => audit!.goalRelevance?.goalIds?.includes(goal.id)).map((goal) => clamp(goal.weight)));
  const durationMinutes = video.durationSeconds / 60;
  const durationFit = durationMinutes <= 0 ? 0 : durationMinutes <= preferences.maxMinutes ? 1 : Math.max(0, 1 - (durationMinutes - preferences.maxMinutes) / 60);
  const feedback = normalizeTopicWeights(preferences.topicWeights)[evaluated.topic] ?? 0;
  const directFeedback = preferences.videoFeedback?.[video.youtubeId] ?? 0;
  const traitFeedback = feedbackTraits(evaluated).reduce((total, trait) => total + clamp(preferences.traitWeights?.[trait] ?? 0, -3, 3), 0);
  const publishedTime = Date.parse(video.publishedAt || "");
  const ageDays = Number.isFinite(publishedTime) ? Math.max(0, (Date.now() - publishedTime) / 86_400_000) : 365;
  const freshness = clamp(1 - ageDays / 90);

  return (
    evaluated.quality * 50 + evaluated.depth * 10 + audit!.insight / 100 * 10 + audit!.evidence / 100 * 10 +
    goalWeight * 10 + Number(isPreferredTopic) * 2 + depthFit * 3 + evergreenFit * 2 + durationFit * 2 +
    freshness * clamp(preferences.discovery / 100) +
    clamp(directFeedback, -1, 1) * 2 + clamp(feedback, -3, 3) / 3 + clamp(traitFeedback, -9, 9) / 9
  );
}

export function explain(video: Video, preferences: Preferences, audit?: ContentAudit) {
  if (!hasSemanticScores(audit)) return "Item salvo por você; ainda sem nota editorial auditada.";
  const reasons: string[] = [];
  reasons.push(`Qualidade auditada: ${audit!.overall}/100`);
  if (audit!.goalRelevance?.reason) reasons.push(audit!.goalRelevance.reason);
  else if (preferences.topics.some((topic) => topicId(topic) === topicId(video.topic))) reasons.push(`relacionado a ${topicLabel(video.topic)}`);
  else reasons.push("conteúdo avaliado individualmente");
  return reasons.join(". ").replace(/[.!?]+$/, "") + ".";
}

export function rankVideos(videos: Video[], preferences: Preferences, audits: AuditMap = {}): RankedVideo[] {
  return videos
    .map((video) => {
      const audit = audits[`video:${video.youtubeId}`];
      return { ...auditedVideo(video, audit), score: scoreVideo(video, preferences, audit), explanation: explain(video, preferences, audit) };
    })
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
