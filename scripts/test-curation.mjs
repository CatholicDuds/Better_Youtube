import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadLocalTs } from "./lib/load-local-ts.mjs";

const { rankVideos, scoreVideo, explain, DEFAULT_PREFERENCES } = loadLocalTs("lib/recommender.ts");
const { isContentApproved, limitDiscoveries } = loadLocalTs("lib/content-audits.ts");
const { topicId } = loadLocalTs("lib/topics.ts");
const { seedVideos } = loadLocalTs("lib/videos.ts");
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const audits = read("public/data/content-audits.json").audits;
const all = [...read("public/data/latest-videos.json").videos, ...read("public/data/discovered-videos.json").videos, ...seedVideos];
const videos = all.filter((v, i) => audits[`video:${v.youtubeId}`] && all.findIndex((other) => other.youtubeId === v.youtubeId) === i);
const preferences = { ...DEFAULT_PREFERENCES, topics: ["filosofia", "natureza humana", "economia", "formação católica"] };
function previousScore(v) {
  const p = preferences, discovery = p.discovery / 100;
  const age = v.publishedAt ? Math.max(0, (Date.now() - Date.parse(v.publishedAt)) / 86400000) : 365;
  return v.quality * 32 + (1 - Math.abs(v.depth - p.depth / 100)) * 20 + v.evergreen * p.evergreen / 100 * 18 +
    (p.topics.includes(v.topic) ? 1 - discovery * .25 : discovery * .9) * 16 +
    (v.durationSeconds / 60 <= p.maxMinutes ? 1 : Math.max(0, 1 - (v.durationSeconds / 60 - p.maxMinutes) / 60)) * 10 +
    v.novelty * discovery * 8 + (p.topicWeights[v.topic] || 0) * 4 + (p.videoFeedback[v.youtubeId] || 0) * 14 + Math.max(0, 1 - age / 45) * discovery * 8;
}
const before = [...videos].sort((a, b) => previousScore(b) - previousScore(a));
const after = rankVideos(videos, preferences, audits);
console.log("Comparação com os mesmos vídeos, preferências e notas históricas. Demonstra a fórmula; não aprova legados sem comprovantes.");
console.table(after.map((v, i) => ({ id: v.youtubeId, before: before.findIndex((old) => old.youtubeId === v.youtubeId) + 1, after: i + 1, oldScore: previousScore(videos.find((old) => old.youtubeId === v.youtubeId)).toFixed(2), newScore: v.score.toFixed(2), overall: audits[`video:${v.youtubeId}`].overall })));

// Synthetic audit only for boundary tests, never saved into the published feed.
const fixture = { method: "semantic-content", approved: true, overall: 85, depth: 85, insight: 85, evidence: 85, captivating: 85, transcriptSource: "youtube-captions", evidenceQuotes: [{ text: "Trecho fictício para teste", timestamp: "04:12" }], goalRelevance: { goalIds: ["formacao-catolica"], reason: "Exemplo de teste", discovery: false } };
const v = { ...seedVideos[0], topic: "fé e razão" };
assert(isContentApproved(fixture));
assert(!isContentApproved({ ...fixture, transcriptSource: "none" }));
assert(!isContentApproved({ ...fixture, evidenceQuotes: [] }));
assert(!isContentApproved({ ...fixture, overall: 95 }));
assert(!isContentApproved({ ...fixture, goalRelevance: { ...fixture.goalRelevance, goalIds: [] } }));
assert.equal(topicId("FÉ E RAZÃO"), topicId("catecismo"));
assert.equal(scoreVideo(v, preferences, fixture), scoreVideo({ ...v, quality: 0, depth: 0 }, preferences, fixture));
assert.equal(scoreVideo(v, preferences), 0);
assert(explain(v, preferences).length > 1);
const aliasPrefs = { ...preferences, topicWeights: { "catecismo": 2 } };
assert.equal(scoreVideo(v, aliasPrefs, fixture), scoreVideo({ ...v, topic: "formacao-catolica" }, { ...aliasPrefs, topicWeights: { "formacao-catolica": 2 } }, fixture));
const liked = { ...preferences, videoFeedback: { [v.youtubeId]: 1 }, topicWeights: { "catecismo": 3 } };
assert(scoreVideo(v, preferences, { ...fixture, overall: 95, depth: 95, evidence: 95, insight: 95 }) > scoreVideo(v, liked, fixture));
const items = Array.from({ length: 30 }, (_, index) => ({ index, goalRelevance: { discovery: index % 2 === 0 } }));
const limited = limitDiscoveries(items, (item) => item);
for (let size = 1; size <= limited.length; size++) assert(limited.slice(0, size).filter((item) => item.goalRelevance.discovery).length <= Math.floor(size * .2));
assert.equal(limitDiscoveries(items.filter((item) => item.goalRelevance.discovery), (item) => item).length, 0);
console.log("Testes de ranking, aliases, evidência, feedback e limite de descobertas: OK.");
