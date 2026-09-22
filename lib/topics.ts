import taxonomy from "../config/topics.json";
import goalConfig from "../config/goals.json";

export function normalizeTopic(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const aliases = new Map(taxonomy.flatMap((topic) => [topic.id, topic.label, ...topic.aliases].map((alias) => [normalizeTopic(alias), topic.id] as const)));
export function topicId(value: string) { return aliases.get(normalizeTopic(value)) || normalizeTopic(value); }
export function knownTopicId(value: string) { return aliases.get(normalizeTopic(value)) || "nao-classificado"; }
export function topicLabel(value: string) { return taxonomy.find((topic) => topic.id === topicId(value))?.label || value.replaceAll("-", " "); }
export const goals = goalConfig.goals;
export const activeGoals = goals.filter((goal) => goal.enabled && goal.weight > 0);

// Migrates old text keys without multiplying feedback when aliases collide.
export function normalizeTopicWeights(weights: Record<string, number>) {
  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(weights)) {
    if (!Number.isFinite(value)) continue;
    const id = topicId(key);
    if (!(id in normalized) || Math.abs(value) > Math.abs(normalized[id])) normalized[id] = Math.max(-3, Math.min(3, value));
  }
  return normalized;
}
