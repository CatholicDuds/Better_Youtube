import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { loadLocalTs } from "./lib/load-local-ts.mjs";

const read = (file) => JSON.parse(readFileSync(file, "utf8"));
for (const directory of ["config", "public/data"]) for (const file of readdirSync(directory).filter((name) => name.endsWith(".json"))) read(`${directory}/${file}`);
const schema = read("config/content-audits.schema.json");
// Validates every keyword used by our checked-in schema; no network/schema downloads.
function valid(value, rule) {
  if (rule.$ref) return valid(value, rule.$ref.slice(2).split("/").reduce((node, key) => node[key], schema));
  if (rule.type) {
    const types = [].concat(rule.type);
    if (!types.some((type) => type === "null" ? value === null : type === "array" ? Array.isArray(value) : type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : typeof value === type)) return false;
  }
  if ("const" in rule && value !== rule.const) return false;
  if (rule.enum && !rule.enum.includes(value)) return false;
  if (typeof value === "number" && (!Number.isFinite(value) || value < (rule.minimum ?? -Infinity) || value > (rule.maximum ?? Infinity) || value <= (rule.exclusiveMinimum ?? -Infinity))) return false;
  if (typeof value === "string" && (value.length < (rule.minLength ?? 0) || value.length > (rule.maxLength ?? Infinity) || (rule.pattern && !new RegExp(rule.pattern).test(value)) || (rule.format === "date-time" && !Number.isFinite(Date.parse(value))))) return false;
  if (Array.isArray(value)) {
    if (value.length < (rule.minItems ?? 0) || value.length > (rule.maxItems ?? Infinity) || (rule.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length)) return false;
    if (rule.items && !value.every((item) => valid(item, rule.items))) return false;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (rule.required?.some((key) => !(key in value))) return false;
    for (const [key, child] of Object.entries(value)) {
      const childRule = rule.properties?.[key] || rule.additionalProperties;
      if (childRule && !valid(child, childRule)) return false;
    }
  }
  if (rule.allOf && !rule.allOf.every((item) => valid(value, item))) return false;
  if (rule.anyOf && !rule.anyOf.some((item) => valid(value, item))) return false;
  if (rule.if) { const branch = valid(value, rule.if) ? rule.then : rule.else; if (branch && !valid(value, branch)) return false; }
  return true;
}
const document = read("public/data/content-audits.json");
assert.equal(document.schemaVersion, 3);
const { isContentApproved } = loadLocalTs("lib/content-audits.ts");
const { normalizeTopic } = loadLocalTs("lib/topics.ts");
const topics = read("config/topics.json");
const ids = new Set(topics.map((topic) => topic.id));
assert.equal(ids.size, topics.length, "IDs de tema duplicados");
const aliases = new Map();
for (const topic of topics) for (const alias of [topic.id, topic.label, ...topic.aliases]) {
  const key = normalizeTopic(alias);
  assert(!aliases.has(key) || aliases.get(key) === topic.id, `Alias ambíguo: ${alias}`);
  aliases.set(key, topic.id);
}
const goals = read("config/goals.json").goals;
assert.equal(new Set(goals.map((goal) => goal.id)).size, goals.length);
for (const goal of goals) {
  assert(goal.weight >= 0 && goal.weight <= 1);
  assert(goal.topicIds.every((id) => ids.has(id)));
}
const discovery = read("config/discovery-topics.json");
assert.equal(new Set(discovery.map((topic) => topic.topic)).size, discovery.length);
for (const topic of discovery) assert(ids.has(topic.topic) && topic.searches.length);
const groups = {};
for (const [key, audit] of Object.entries(document.audits)) {
  assert(valid(audit, schema.$defs.audit), `Auditoria fora do esquema: ${key}`);
  assert(audit.goalRelevance.goalIds.every((id) => goals.some((goal) => goal.id === id)), `Objetivo inválido: ${key}`);
  if (audit.approved) assert(isContentApproved(audit), `Aprovação inválida: ${key}`);
  const type = key.split(":")[0];
  const group = groups[type] ||= { examined: 0, approved: 0, discoveries: 0 };
  group.examined++; if (audit.approved) group.approved++;
  if (audit.approved && audit.goalRelevance.discovery) group.discoveries++;
}
for (const [type, group] of Object.entries(groups)) {
  assert(group.discoveries <= Math.floor(group.approved * .2), `Mais de 20% descobertas em ${type}`);
  console.log(`${type}: ${group.examined} registros, ${group.approved} aprovados, ${group.examined - group.approved} rejeitados; taxa ${(100 * group.approved / group.examined).toFixed(1)}%`);
}
for (const dimension of ["overall", "depth", "insight", "evidence", "captivating"]) {
  const bins = [0, 0, 0, 0, 0];
  for (const audit of Object.values(document.audits)) bins[audit[dimension] < 40 ? 0 : audit[dimension] < 60 ? 1 : audit[dimension] < 75 ? 2 : audit[dimension] < 90 ? 3 : 4]++;
  console.log(`${dimension} [0–39,40–59,60–74,75–89,90–100]: ${bins.join(", ")}`);
}
console.log("JSONs, esquema, objetivos, aliases e limite de descobertas válidos. Notas legadas não representam nova avaliação.");
