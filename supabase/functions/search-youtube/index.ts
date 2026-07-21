import { withSupabase } from "npm:@supabase/server@^1";

const USER_DAILY_LIMIT = 10;
const ADMIN_DAILY_LIMIT = 25;
const GLOBAL_DAILY_LIMIT = 50;
const SEARCH_STOP_WORDS = new Set(["a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas", "para", "por", "com", "como", "que", "um", "uma", "sobre", "ao", "aos", "the", "of", "and", "for", "to", "in"]);
const SHALLOW_TEXT = /\b(urgente|chocante|voce nao vai acreditar|veja o que aconteceu|bomba|treta|fofoca|humilhou|destruiu|lacrou|mitou|viralizou|daily affirmations?|sleep sounds?|white noise|cortes? (do|de) podcast|youtube shorts)\b/i;
const TRUSTED_NEWS: Array<[RegExp, number]> = [
  [/Reuters/i, 1], [/Associated Press|AP News/i, .99], [/Nature$/i, .99], [/NASA/i, .99],
  [/Financial Times/i, .98], [/Foreign Affairs/i, .98], [/Vatican News/i, .98],
  [/The Economist/i, .97], [/Harvard Business Review/i, .97], [/MIT Technology Review/i, .97],
  [/Agência FAPESP/i, .97], [/BBC/i, .96], [/Scientific American/i, .96],
  [/Catholic News Agency|ACI Digital/i, .95], [/Deutsche Welle|DW Brasil|^dw\.com$/i, .94],
  [/Valor Econômico/i, .94], [/Nexo Jornal/i, .94], [/Agência Brasil/i, .92], [/The Guardian/i, .92],
];
const ENGLISH_TERMS: Record<string, string> = {
  administracao: "management", astronomia: "astronomy", catolico: "catholic", catolica: "catholic",
  ciencia: "science", criacao: "creation", economia: "economics", empresas: "companies",
  aulas: "lessons", educacao: "education", espaco: "space", estrategia: "strategy", fe: "faith", filosofia: "philosophy", foguete: "rocket",
  foguetes: "rockets", gestao: "management", geopolitica: "geopolitics", historia: "history",
  humano: "human", humanos: "human", igreja: "church", inovacao: "innovation", inteligencia: "intelligence",
  lideranca: "leadership", negocios: "business", natureza: "nature", politica: "politics", roteiros: "screenwriting",
  tecnologia: "technology", videos: "videos",
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

function normalize(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function meaningfulTerms(value: string) {
  const terms = normalize(value).split(/\s+/).filter((term) => term.length >= 2 && !SEARCH_STOP_WORDS.has(term));
  return terms.length ? [...new Set(terms)] : normalize(value).split(/\s+/).filter(Boolean);
}

function termAppears(text: string, term: string) {
  return text.includes(term) || (term.length > 4 && term.endsWith("s") && text.includes(term.slice(0, -1)));
}

function relevanceCoverage(text: string, query: string) {
  const normalizedText = normalize(text);
  const terms = meaningfulTerms(query);
  return terms.filter((term) => termAppears(normalizedText, term)).length / Math.max(1, terms.length);
}

function englishSearchQuery(query: string) {
  return meaningfulTerms(query).map((term) => ENGLISH_TERMS[term] || term).join(" ");
}

function bilingualCoverage(text: string, query: string) {
  return Math.max(relevanceCoverage(text, query), relevanceCoverage(text, englishSearchQuery(query)));
}

function decodeXml(value = "") {
  return value.replace(/^<!\[CDATA\[|\]\]>$/g, "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
}

function xmlValue(block: string, tag: string) {
  return decodeXml(block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))?.[1] || "");
}

function newsSourceQuality(source: string) {
  return TRUSTED_NEWS.find(([pattern]) => pattern.test(source))?.[1] || 0;
}

function newsSourceSpectrum(source: string) {
  if (/Nexo Jornal|Folha de S\.Paulo|The Guardian/i.test(source)) return "Esquerda";
  if (/Estadão|O Estado de S\. Paulo|The Economist|Catholic News Agency|ACI Digital|Crux/i.test(source)) return "Direita";
  return "Centro";
}

function podcastSlug(url: string, fallback: string) {
  try {
    return new URL(url).pathname.split("/podcast/")[1]?.split("/id")[0] || fallback;
  } catch {
    return fallback;
  }
}

async function searchYouTube(apiKey: string | undefined, query: string) {
  if (!apiKey) throw new Error("missing_api_key");
  const searchParams = new URLSearchParams({
    part: "snippet", type: "video", maxResults: "50", order: "relevance", safeSearch: "moderate",
    videoEmbeddable: "true", videoSyndicated: "true", relevanceLanguage: "pt", regionCode: "BR", q: query, key: apiKey,
  });
  const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
  if (!searchResponse.ok) throw new Error(searchResponse.status === 403 ? "youtube_quota" : "youtube_search_failed");
  const searchData = await searchResponse.json();
  const ids = (searchData.items || []).map((item: { id?: { videoId?: string } }) => item.id?.videoId).filter(Boolean);
  if (!ids.length) return { items: [], examined: 0 };
  const detailParams = new URLSearchParams({ part: "snippet,contentDetails,statistics,status", id: ids.join(","), key: apiKey });
  const detailResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`);
  if (!detailResponse.ok) throw new Error(detailResponse.status === 403 ? "youtube_quota" : "youtube_details_failed");
  const detailData = await detailResponse.json();
  const items = Array.isArray(detailData.items) ? detailData.items : [];
  return { items, examined: items.length };
}

async function fetchNewsFeed(query: string, locale: { hl: string; gl: string; ceid: string }) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `${query} when:7d`);
  url.searchParams.set("hl", locale.hl);
  url.searchParams.set("gl", locale.gl);
  url.searchParams.set("ceid", locale.ceid);
  const response = await fetch(url, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
  if (!response.ok) throw new Error("news_search_failed");
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 50).map((match, index) => {
    const block = match[1];
    const source = xmlValue(block, "source") || "Google Notícias";
    let title = xmlValue(block, "title");
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -source.length - 3);
    const publishedTime = Date.parse(xmlValue(block, "pubDate"));
    const publishedAt = new Date(Number.isFinite(publishedTime) ? publishedTime : Date.now()).toISOString();
    return { id: `search-news-${locale.gl}-${index}-${Date.parse(publishedAt)}`, title, source, url: xmlValue(block, "link"), category: "Pesquisa", publishedAt, quality: newsSourceQuality(source), spectrum: newsSourceSpectrum(source) };
  });
}

async function searchNews(query: string) {
  const englishQuery = englishSearchQuery(query);
  const feeds = await Promise.all([
    fetchNewsFeed(query, { hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" }),
    fetchNewsFeed(englishQuery, { hl: "en-US", gl: "US", ceid: "US:en" }),
  ]);
  const all = feeds.flat();
  const minimumCoverage = meaningfulTerms(query).length <= 2 ? .5 : .4;
  const sourceCount = new Map<string, number>();
  const items = all
    .filter((item, index) => item.title && item.url && item.quality >= .9 && !SHALLOW_TEXT.test(normalize(item.title)) && bilingualCoverage(item.title, query) >= minimumCoverage && all.findIndex((candidate) => normalize(candidate.title) === normalize(item.title)) === index)
    .sort((a, b) => b.quality - a.quality || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .filter((item) => {
      const key = normalize(item.source);
      const count = sourceCount.get(key) || 0;
      if (count >= 2) return false;
      sourceCount.set(key, count + 1);
      return true;
    })
    .slice(0, 12);
  return { items, examined: all.length };
}

async function fetchPodcastCatalog(query: string, country: string) {
  const url = new URL("https://itunes.apple.com/search");
  Object.entries({ media: "podcast", entity: "podcast", limit: "25", country, term: query }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { "user-agent": "ClarityLearningFeed/1.0" } });
  if (!response.ok) throw new Error("podcast_search_failed");
  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

async function searchPodcasts(query: string) {
  const catalogs = await Promise.all([fetchPodcastCatalog(query, "BR"), fetchPodcastCatalog(englishSearchQuery(query), "US")]);
  const all = catalogs.flat();
  const minimumCoverage = meaningfulTerms(query).length <= 2 ? .5 : .34;
  const now = Date.now();
  const items = all.map((item, index) => {
    const title = String(item.collectionName || "");
    const author = String(item.artistName || "");
    const genres = Array.isArray(item.genres) ? item.genres.join(" ") : "";
    const coverage = bilingualCoverage(`${title} ${author} ${genres}`, query);
    const releaseTime = Date.parse(item.releaseDate || "");
    const active = Number.isFinite(releaseTime) && now - releaseTime <= 730 * 86_400_000;
    const trackCount = Number(item.trackCount || 0);
    const apiRank = 1 - (index % 25) / 25;
    const score = coverage * .55 + apiRank * .2 + (active ? .15 : 0) + Math.min(.1, trackCount / 1000);
    return { item, title, author, coverage, active, trackCount, score };
  }).filter(({ item, title, coverage, active, trackCount }) => item.collectionId && item.collectionViewUrl && item.artworkUrl600 && title && !SHALLOW_TEXT.test(normalize(title)) && coverage >= minimumCoverage && active && trackCount >= 5)
    .sort((a, b) => b.score - a.score)
    .filter((entry, index, array) => array.findIndex((candidate) => String(candidate.item.collectionId) === String(entry.item.collectionId)) === index)
    .slice(0, 18)
    .map(({ item, title, author, score }, index) => ({
      id: `search-podcast-${item.collectionId}`,
      appleId: String(item.collectionId),
      slug: podcastSlug(String(item.collectionViewUrl), normalize(title).replaceAll(" ", "-")),
      title,
      author,
      category: "Pesquisa",
      description: `Podcast ativo relacionado a “${query}”, aprovado por relevância temática e consistência editorial.`,
      depth: Math.min(.94, .72 + score * .2),
      clarity: Math.min(.94, .76 + score * .16),
      accent: ["#5b6ff0", "#be8c52", "#cf5368", "#295c9d", "#6a4ba0", "#446a75"][index % 6],
      artworkUrl: String(item.artworkUrl600),
      appleUrl: String(item.collectionViewUrl),
    }));
  return { items, examined: all.length };
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    let query = "";
    try {
      const body = await request.json();
      query = String(body?.query || "").trim();
    } catch {
      return json({ error: "invalid_body" }, 400);
    }
    if (query.length < 2 || query.length > 120) return json({ error: "invalid_query" }, 400);

    const { data: hasAccess, error: accessError } = await context.supabase.rpc("current_user_has_access");
    if (accessError || !hasAccess) return json({ error: "access_denied" }, 403);
    const userId = String(context.jwtClaims?.sub || "");
    if (!userId) return json({ error: "invalid_session" }, 401);

    const { data: profile } = await context.supabase.from("profiles").select("role").eq("id", userId).single();
    const userLimit = profile?.role === "admin" ? ADMIN_DAILY_LIMIT : USER_DAILY_LIMIT;
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const [{ count: userCount, error: userCountError }, { count: globalCount, error: globalCountError }] = await Promise.all([
      context.supabaseAdmin.from("youtube_search_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since),
      context.supabaseAdmin.from("youtube_search_usage").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    if (userCountError || globalCountError) return json({ error: "usage_check_failed" }, 503);
    if ((userCount || 0) >= userLimit || (globalCount || 0) >= GLOBAL_DAILY_LIMIT) return json({ error: "daily_limit" }, 429);
    const { error: usageError } = await context.supabaseAdmin.from("youtube_search_usage").insert({ user_id: userId });
    if (usageError) return json({ error: "usage_write_failed" }, 503);

    const results = await Promise.allSettled([
      searchYouTube(Deno.env.get("YOUTUBE_API_KEY"), query),
      searchNews(query),
      searchPodcasts(query),
    ]);
    const videos = results[0].status === "fulfilled" ? results[0].value : { items: [], examined: 0 };
    const news = results[1].status === "fulfilled" ? results[1].value : { items: [], examined: 0 };
    const podcasts = results[2].status === "fulfilled" ? results[2].value : { items: [], examined: 0 };
    const warnings = results.flatMap((result) => result.status === "rejected" ? [result.reason instanceof Error ? result.reason.message : "source_failed"] : []);
    if (warnings.length === 3) return json({ error: "all_sources_failed" }, 502);
    return json({
      items: videos.items,
      news: news.items,
      podcasts: podcasts.items,
      meta: { videosExamined: videos.examined, newsExamined: news.examined, podcastsExamined: podcasts.examined },
      warnings,
    });
  }),
};
