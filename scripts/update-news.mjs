import { mkdir, writeFile } from "node:fs/promises";

const searches = [
  { query: "política Brasil análise (site:agenciabrasil.ebc.com.br OR site:bbc.com/portuguese OR site:nexojornal.com.br OR site:estadao.com.br)", category: "Política", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" },
  { query: "política economia sociedade Brasil (site:nexojornal.com.br OR site:folha.uol.com.br)", category: "Política", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" },
  { query: "economia Brasil negócios (site:valor.globo.com OR site:agenciabrasil.ebc.com.br OR site:bbc.com/portuguese OR site:reuters.com)", category: "Negócios", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" },
  { query: "geopolítica relações internacionais (site:bbc.com/portuguese OR site:dw.com OR site:agenciabrasil.ebc.com.br OR site:reuters.com)", category: "Mundo", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" },
  { query: "ciência astronomia exploração espacial (site:agencia.fapesp.br OR site:nasa.gov OR site:bbc.com/portuguese OR site:nature.com)", category: "Ciência", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" },
  { query: "tecnologia empresas inovação (site:technologyreview.com OR site:hbr.org OR site:reuters.com OR site:valor.globo.com)", category: "Criação", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" },
  { query: "Igreja Católica Vaticano Brasil (site:vaticannews.va OR site:acidigital.com OR site:cnbb.org.br)", category: "Fé", hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" },
  { query: "politics institutions democracy (site:reuters.com OR site:apnews.com OR site:bbc.com)", category: "Política", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "politics economy society analysis site:theguardian.com", category: "Política", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "global economy companies (site:reuters.com OR site:ft.com OR site:economist.com OR site:hbr.org)", category: "Negócios", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "global geopolitics diplomacy (site:reuters.com OR site:apnews.com OR site:bbc.com OR site:foreignaffairs.com)", category: "Mundo", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "science astronomy space (site:nature.com OR site:science.org OR site:nasa.gov OR site:scientificamerican.com)", category: "Ciência", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "technology companies innovation (site:reuters.com OR site:technologyreview.com OR site:hbr.org)", category: "Criação", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "Catholic Church Vatican (site:vaticannews.va OR site:catholicnewsagency.com OR site:cruxnow.com OR site:reuters.com)", category: "Fé", hl: "en-US", gl: "US", ceid: "US:en" },
];

const trustedSources = [
  [/Reuters/i, 1], [/Associated Press|AP News/i, .99], [/Nature$/i, .99], [/NASA/i, .99],
  [/Financial Times/i, .98], [/Foreign Affairs/i, .98], [/Vatican News/i, .98],
  [/The Economist/i, .97], [/Harvard Business Review/i, .97], [/MIT Technology Review/i, .97],
  [/BBC/i, .96], [/Scientific American/i, .96], [/Deutsche Welle|DW Brasil|^dw\.com$/i, .94],
  [/Agência FAPESP/i, .97], [/Catholic News Agency|ACI Digital/i, .95], [/CNBB/i, .94],
  [/Valor Econômico/i, .94], [/Nexo Jornal/i, .94], [/Agência Brasil/i, .92], [/Crux/i, .92], [/The Guardian/i, .92],
  [/Folha de S\.Paulo/i, .9], [/Estadão|O Estado de S\. Paulo/i, .9], [/CNN Brasil/i, .86],
];
const shallowHeadline = /urgente|chocante|você não vai acreditar|veja o que aconteceu|bomba|detonou|humilhou|viralizou/i;

function sourceQuality(source) {
  return trustedSources.find(([pattern]) => pattern.test(source))?.[1] || .62;
}

function sourceSpectrum(source) {
  if (/Nexo Jornal|Folha de S\.Paulo|The Guardian/i.test(source)) return "Esquerda";
  if (/Estadão|O Estado de S\. Paulo|The Economist|Catholic News Agency|ACI Digital|Crux/i.test(source)) return "Direita";
  return "Centro";
}

function decodeXml(value = "") {
  return value.replace(/^<!\[CDATA\[|\]\]>$/g, "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
}

function valueOf(block, tag) {
  return decodeXml(block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))?.[1] || "");
}

async function fetchNews(search) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `${search.query} when:7d`);
  url.searchParams.set("hl", search.hl);
  url.searchParams.set("gl", search.gl);
  url.searchParams.set("ceid", search.ceid);
  const response = await fetch(url, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
  if (!response.ok) throw new Error(`Notícias ${search.category}: ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match, index) => {
    const block = match[1];
    const publishedAt = new Date(valueOf(block, "pubDate")).toISOString();
    const source = valueOf(block, "source") || "Google Notícias";
    let title = valueOf(block, "title");
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -source.length - 3);
    return { id: `news-${search.category}-${search.gl}-${index}-${Date.parse(publishedAt)}`, title, source, url: valueOf(block, "link"), category: search.category, publishedAt, quality: sourceQuality(source), spectrum: sourceSpectrum(source) };
  }).filter((item) => item.title && item.url && !shallowHeadline.test(item.title));
}

const settled = await Promise.allSettled(searches.map(fetchNews));
const all = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
const news = all.filter((item, index) => all.findIndex((candidate) => candidate.title.toLowerCase() === item.title.toLowerCase()) === index).sort((a, b) => {
  const freshnessA = Math.max(0, 1 - (Date.now() - Date.parse(a.publishedAt)) / (7 * 86_400_000));
  const freshnessB = Math.max(0, 1 - (Date.now() - Date.parse(b.publishedAt)) / (7 * 86_400_000));
  return (b.quality * .75 + freshnessB * .25) - (a.quality * .75 + freshnessA * .25);
});
if (!news.length) {
  console.warn("Clarity: nenhuma notícia nova; mantendo o arquivo publicado anteriormente.");
  process.exit(0);
}

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/data/news.json", import.meta.url), `${JSON.stringify({ updatedAt: new Date().toISOString(), source: "Google News RSS", spectrumMethod: "Orientação aproximada da fonte; não classifica a opinião de cada matéria.", news }, null, 2)}\n`, "utf8");
console.log(`Clarity: ${news.length} notícias atualizadas de ${settled.filter((item) => item.status === "fulfilled").length} temas.`);
