import { activeGoals } from "./topics";

export type ContentAudit = {
  approved: boolean;
  method: "semantic-content";
  overall: number;
  depth: number;
  insight: number;
  evidence: number;
  captivating: number;
  thesis: string;
  reasons: string[];
  auditedAt: string;
  transcriptSource: "youtube-captions" | "transcript-published" | "primary-source" | "none";
  evidenceQuotes: { text: string; timestamp: string | null; locator?: string }[];
  goalRelevance: { goalIds: string[]; reason: string; discovery: boolean };
  exceptionalJustification?: string;
};
export type AuditMap = Record<string, ContentAudit>;

export function hasSemanticScores(audit?: ContentAudit) {
  return audit?.method === "semantic-content" && [audit.overall, audit.depth, audit.insight, audit.evidence, audit.captivating].every((score) => Number.isFinite(score) && score >= 0 && score <= 100);
}

export function isContentApproved(audit?: ContentAudit): audit is ContentAudit {
  if (!audit || !hasSemanticScores(audit) || !audit.approved || !["youtube-captions", "transcript-published", "primary-source"].includes(audit.transcriptSource)) return false;
  if (!Array.isArray(audit.evidenceQuotes) || audit.evidenceQuotes.length < 1 || audit.evidenceQuotes.length > 2) return false;
  if (!audit.evidenceQuotes.every((quote) => quote && typeof quote.text === "string" && quote.text.trim() && quote.text.length <= 240 && (audit.transcriptSource === "primary-source" ? typeof quote.locator === "string" && Boolean(quote.locator.trim()) : typeof quote.timestamp === "string" && /^(?:\d+:)?\d{1,2}:[0-5]\d$/.test(quote.timestamp)))) return false;
  if ([audit.overall, audit.depth, audit.insight, audit.evidence, audit.captivating].some((score) => score > 90) && !audit.exceptionalJustification?.trim()) return false;
  const relevance = audit.goalRelevance;
  return Boolean(relevance?.reason?.trim() && Array.isArray(relevance.goalIds) && (relevance.discovery === true || activeGoals.some((goal) => relevance.goalIds.includes(goal.id))));
}

// Every visible prefix has at most 20% discoveries, including feeds with <5 items.
export function limitDiscoveries<T>(items: T[], auditFor: (item: T) => ContentAudit | undefined) {
  const direct = items.filter((item) => !auditFor(item)?.goalRelevance?.discovery);
  const discoveries = items.filter((item) => auditFor(item)?.goalRelevance?.discovery);
  const selected: T[] = [];
  let discoveryIndex = 0;
  for (const item of direct) {
    selected.push(item);
    if (selected.length % 5 === 4 && discoveryIndex < discoveries.length) selected.push(discoveries[discoveryIndex++]);
  }
  return selected;
}
