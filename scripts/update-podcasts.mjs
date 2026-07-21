import { mkdir, writeFile } from "node:fs/promises";

const ids = ["1347139874", "991572436", "1193387182", "1553427360", "1455626095", "191182582"];
const response = await fetch(`https://itunes.apple.com/lookup?id=${ids.join(",")}&country=BR&entity=podcast`, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
if (!response.ok) {
  console.warn(`Clarity: capas do Apple Podcasts indisponíveis (${response.status}); mantendo o arquivo anterior.`);
  process.exit(0);
}
const data = await response.json();
const podcasts = (data.results || []).filter((item) => item.collectionId && item.artworkUrl600).map((item) => ({
  appleId: String(item.collectionId),
  title: item.collectionName,
  artworkUrl: item.artworkUrl600,
  appleUrl: item.collectionViewUrl,
}));
if (!podcasts.length) {
  console.warn("Clarity: nenhuma capa de podcast encontrada; mantendo o arquivo anterior.");
  process.exit(0);
}
await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/data/podcasts.json", import.meta.url), `${JSON.stringify({ updatedAt: new Date().toISOString(), source: "Apple iTunes Search API", podcasts }, null, 2)}\n`, "utf8");
console.log(`Clarity: ${podcasts.length} capas oficiais do Apple Podcasts atualizadas.`);
