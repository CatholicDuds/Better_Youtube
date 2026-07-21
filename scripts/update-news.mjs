import { mkdir, writeFile } from "node:fs/promises";

const searches = [
  { query: "política Brasil análise", category: "Política" },
  { query: "economia Brasil negócios", category: "Negócios" },
  { query: "geopolítica relações internacionais", category: "Mundo" },
  { query: "ciência astronomia exploração espacial", category: "Ciência" },
  { query: "tecnologia empresas inovação", category: "Criação" },
  { query: "Igreja Católica Vaticano Brasil", category: "Fé" },
];

function decodeXml(value = "") {
  return value.replace(/^<!\[CDATA\[|\]\]>$/g, "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
}

function valueOf(block, tag) {
  return decodeXml(block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))?.[1] || "");
}

async function fetchNews(search) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `${search.query} when:7d`);
  url.searchParams.set("hl", "pt-BR");
  url.searchParams.set("gl", "BR");
  url.searchParams.set("ceid", "BR:pt-419");
  const response = await fetch(url, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
  if (!response.ok) throw new Error(`Notícias ${search.category}: ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match, index) => {
    const block = match[1];
    const publishedAt = new Date(valueOf(block, "pubDate")).toISOString();
    const source = valueOf(block, "source") || "Google Notícias";
    let title = valueOf(block, "title");
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -source.length - 3);
    return { id: `news-${search.category}-${index}-${Date.parse(publishedAt)}`, title, source, url: valueOf(block, "link"), category: search.category, publishedAt };
  }).filter((item) => item.title && item.url);
}

const settled = await Promise.allSettled(searches.map(fetchNews));
const all = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
const news = all.filter((item, index) => all.findIndex((candidate) => candidate.title.toLowerCase() === item.title.toLowerCase()) === index).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
if (!news.length) {
  console.warn("Clarity: nenhuma notícia nova; mantendo o arquivo publicado anteriormente.");
  process.exit(0);
}

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/data/news.json", import.meta.url), `${JSON.stringify({ updatedAt: new Date().toISOString(), source: "Google News RSS", news }, null, 2)}\n`, "utf8");
console.log(`Clarity: ${news.length} notícias atualizadas de ${settled.filter((item) => item.status === "fulfilled").length} temas.`);
