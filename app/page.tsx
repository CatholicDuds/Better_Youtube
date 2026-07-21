"use client";
/* eslint-disable @next/next/no-img-element -- capas e thumbnails vêm de CDNs oficiais em uma exportação estática */

import { useEffect, useMemo, useState } from "react";
import { seedVideos, type Video } from "../lib/videos";
import { DEFAULT_PREFERENCES, rankVideos, type Preferences, type RankedVideo } from "../lib/recommender";
import { readings } from "../lib/readings";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const defaultInterests = [
  { label: "Negócios", icon: "▥" },
  { label: "Ideias", icon: "◈" },
  { label: "Mundo", icon: "◎" },
  { label: "Política", icon: "⚖" },
  { label: "Fé", icon: "✦" },
  { label: "Ciência", icon: "⚗" },
  { label: "Criação", icon: "✎" },
];
const defaultInterestLabels = defaultInterests.map((item) => item.label);

type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
};

type Article = {
  title: string;
  kicker: string;
  paragraphs: string[];
  principle: string;
};

type Podcast = {
  id: string;
  appleId: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  description: string;
  depth: number;
  clarity: number;
  accent: string;
  artworkUrl?: string;
  appleUrl?: string;
};

const podcasts: Podcast[] = [
  { id: "nova-acropole", appleId: "1347139874", slug: "nova-acropole-podcast-filosofia", title: "Nova Acrópole Podcast Filosofia", author: "Nova Acrópole do Brasil", category: "Ideias", description: "Filosofia clássica aplicada ao cotidiano, com linguagem progressiva e exemplos concretos.", depth: .9, clarity: .91, accent: "#8267e8" },
  { id: "filosofia-pop", appleId: "991572436", slug: "filosofia-pop", title: "Filosofia Pop", author: "Filosofia Pop", category: "Ideias", description: "Conversas longas que conectam filosofia, cultura, política e experiência brasileira.", depth: .94, clarity: .78, accent: "#3677d8" },
  { id: "petit-journal", appleId: "1193387182", slug: "petit-journal", title: "Petit Journal", author: "Daniel Sousa e Tanguy Baghdadi", category: "Mundo", description: "Economia e política internacional explicadas por professores, com contexto histórico.", depth: .82, clarity: .94, accent: "#d64848" },
  { id: "os-socios", appleId: "1553427360", slug: "os-sócios-podcast", title: "Os Sócios Podcast", author: "Grupo Primo", category: "Negócios", description: "Negócios, dinheiro e desenvolvimento pessoal em conversas acessíveis e extensas.", depth: .78, clarity: .9, accent: "#d59d2a" },
  { id: "christo", appleId: "1455626095", slug: "christo-nihil-praeponere", title: "Christo Nihil Praeponere", author: "Padre Paulo Ricardo", category: "Fé", description: "Formação espiritual diária a partir do Evangelho e da tradição católica.", depth: .86, clarity: .94, accent: "#9f7549" },
  { id: "cafe-brasil", appleId: "191182582", slug: "canal-café-brasil", title: "Canal Café Brasil", author: "Luciano Pires", category: "Mundo", description: "Comportamento, cidadania, política e cultura para exercitar autonomia de pensamento.", depth: .76, clarity: .9, accent: "#228b70" },
];

const articles: Article[] = [
  {
    kicker: "ESTRATÉGIA · 4 MIN",
    title: "Pensar em segunda ordem muda a qualidade de uma decisão",
    paragraphs: [
      "Uma decisão apressada olha apenas para o primeiro efeito. O pensamento de segunda ordem pergunta o que acontece depois — e depois disso.",
      "Antes de decidir, descreva o efeito imediato, o efeito provável em seis meses e o comportamento que a escolha recompensa. Essa pequena árvore de consequências revela custos que uma planilha não mostra.",
    ],
    principle: "Se eu repetir esta decisão cem vezes, no que ela transforma meu sistema?",
  },
  {
    kicker: "CRIAÇÃO · 5 MIN",
    title: "Um bom vídeo começa com tensão, não com introdução",
    paragraphs: [
      "Roteiros fracos começam explicando o tema. Roteiros fortes começam mostrando por que o tema é um problema, uma contradição ou uma pergunta que merece resposta.",
      "Organize o vídeo em quatro movimentos: promessa, contexto, descoberta e consequência. Corte tudo o que não serve à ideia central.",
    ],
    principle: "Você pensa X, mas Y — e isso importa porque Z.",
  },
  {
    kicker: "CURIOSIDADE · 4 MIN",
    title: "Curiosidade boa substitui uma imagem mental ruim",
    paragraphs: [
      "Aprender não é colecionar fatos. É trocar uma representação imprecisa por outra que explica mais e prevê melhor.",
      "Depois de um vídeo, pergunte: qual imagem eu carregava sem perceber? O que agora consigo explicar que antes apenas repetia?",
    ],
    principle: "Conhecimento valioso muda as perguntas que somos capazes de fazer.",
  },
];

function durationLabel(seconds: number) {
  if (!seconds) return "aula";
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}

function isoDurationSeconds(value = "PT0S") {
  const match = value.match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0);
}

function relativeDate(publishedAt: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000));
  if (days === 0) return "publicado hoje";
  if (days < 30) return `há ${days} dias`;
  if (days < 365) return `há ${Math.floor(days / 30)} meses`;
  const years = Math.floor(days / 365);
  return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}

function thumbnail(video: Video) {
  const id = video.thumbnailId || (video.embedType !== "playlist" ? video.youtubeId : "");
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function embedUrl(video: Video) {
  return video.embedType === "playlist"
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${video.youtubeId}&rel=0`
    : `https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`;
}

function podcastEmbed(podcast: Podcast, theme: "dark" | "light") {
  return `https://embed.podcasts.apple.com/br/podcast/${podcast.slug}/id${podcast.appleId}?theme=${theme}`;
}

function levelLabel(depth: number) {
  if (depth >= .86) return "Avançado";
  if (depth >= .68) return "Intermediário";
  return "Essencial";
}

function seededNoise(id: string, seed: number) {
  let hash = seed || 1;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 2654435761);
  return ((hash >>> 0) % 1000) / 1000;
}

function interestIcon(label: string) {
  return defaultInterests.find((item) => item.label === label)?.icon || "◆";
}

function summaryPrompt(level: "Essencial" | "Intermediário" | "Avançado") {
  if (level === "Essencial") return "Explique com palavras simples, como se ensinasse a alguém que nunca viu o tema.";
  if (level === "Avançado") return "Defina a tese, o mecanismo causal, as evidências, as objeções e os limites da ideia.";
  return "Explique a ideia central, como ela funciona e por que ela importa, sem copiar frases da fonte.";
}

function PodcastCard({ podcast, onPlay }: { podcast: Podcast; onPlay: (podcast: Podcast) => void }) {
  return (
    <article className="podcast-card">
      <button className="podcast-art" style={{ background: `linear-gradient(145deg, ${podcast.accent}, #111)` }} onClick={() => onPlay(podcast)} aria-label={`Ouvir ${podcast.title}`}>
        {podcast.artworkUrl ? <img src={podcast.artworkUrl} alt={`Capa oficial de ${podcast.title}`} loading="lazy" /> : <span className="podcast-fallback">◖))</span>}<span className="podcast-play">▶</span>
      </button>
      <div className="podcast-copy"><p>{podcast.category} · {levelLabel(podcast.depth)}</p><button onClick={() => onPlay(podcast)}>{podcast.title}</button><span>{podcast.author}</span><small>{podcast.description}</small><em>{Math.round(podcast.clarity * 100)}% clareza editorial</em>{podcast.appleUrl && <a href={podcast.appleUrl} target="_blank" rel="noreferrer">Ver no Apple Podcasts ↗</a>}</div>
    </article>
  );
}

function VideoCard({ video, onPlay, onFeedback }: {
  video: RankedVideo;
  onPlay: (video: RankedVideo) => void;
  onFeedback: (id: string, value: 1 | -1) => void;
}) {
  const image = thumbnail(video);
  return (
    <article className="video-card">
      <button className={`thumbnail visual-${video.palette}`} onClick={() => onPlay(video)} aria-label={`Assistir ${video.title}`}>
        {image ? <img src={image} alt="" loading="lazy" /> : <span className="thumbnail-mark">{video.mark}</span>}
        <span className="thumbnail-play">▶</span>
        <span className="duration">{video.embedType === "playlist" ? "coleção" : durationLabel(video.durationSeconds)}</span>
      </button>
      <div className="video-info">
        <div className="channel-avatar" aria-hidden="true">{video.channel.slice(0, 1)}</div>
        <div className="video-copy">
          <button className="video-title" onClick={() => onPlay(video)}>{video.title}</button>
          <p>{video.channel}</p>
          <p>{video.topic} · {video.publishedLabel} · <span className="level-tag">{levelLabel(video.depth)}</span></p>
          <details>
            <summary>Por que foi recomendado?</summary>
            <span>{video.explanation}</span>
          </details>
          <div className="feedback-row">
            <button onClick={() => onFeedback(video.id, 1)}>＋ mais assim</button>
            <button onClick={() => onFeedback(video.id, -1)}>− menos assim</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [category, setCategory] = useState("Todos");
  const [userInterests, setUserInterests] = useState<string[]>(defaultInterestLabels);
  const [query, setQuery] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [liveVideos, setLiveVideos] = useState<Video[]>([]);
  const [discoveredVideos, setDiscoveredVideos] = useState<Video[]>([]);
  const [webVideos, setWebVideos] = useState<Video[]>([]);
  const [customVideos, setCustomVideos] = useState<Video[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [playing, setPlaying] = useState<RankedVideo | null>(null);
  const [playingPodcast, setPlayingPodcast] = useState<Podcast | null>(null);
  const [podcastArtwork, setPodcastArtwork] = useState<Record<string, { artworkUrl: string; appleUrl: string }>>({});
  const [showControls, setShowControls] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showSearchSetup, setShowSearchSetup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInterestManager, setShowInterestManager] = useState(false);
  const [addError, setAddError] = useState("");
  const [searchApiKey, setSearchApiKey] = useState("");
  const [webSearching, setWebSearching] = useState(false);
  const [webSearchStatus, setWebSearchStatus] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string | null>(null);
  const [newsPeriod, setNewsPeriod] = useState<"today" | "week">("today");
  const [visibleCount, setVisibleCount] = useState(12);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [languageLevel, setLanguageLevel] = useState<"Essencial" | "Intermediário" | "Avançado">("Intermediário");
  const [watchedBlock, setWatchedBlock] = useState<string[]>([]);
  const [articleIndex, setArticleIndex] = useState(0);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [reflectionVideos, setReflectionVideos] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [principle, setPrinciple] = useState("");
  const [connections, setConnections] = useState("");
  const [evidence, setEvidence] = useState("");
  const [application, setApplication] = useState("");
  const [currentTime] = useState(() => Date.now());

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("clarity-theme") as "dark" | "light" | null;
      const storedPrefs = localStorage.getItem("clarity-preferences");
      const storedVideos = localStorage.getItem("clarity-videos");
      const storedLevel = localStorage.getItem("clarity-language-level") as "Essencial" | "Intermediário" | "Avançado" | null;
      const storedSearchKey = localStorage.getItem("clarity-youtube-api-key");
      const storedInterests = localStorage.getItem("clarity-interests");
      queueMicrotask(() => {
        if (storedTheme) setTheme(storedTheme);
        if (storedPrefs) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) });
        if (storedVideos) setCustomVideos(JSON.parse(storedVideos));
        if (storedLevel) setLanguageLevel(storedLevel);
        if (storedSearchKey) setSearchApiKey(storedSearchKey);
        if (storedInterests) setUserInterests(JSON.parse(storedInterests));
        if (!localStorage.getItem("clarity-onboarding-complete")) setShowOnboarding(true);
      });
    } catch {}

    fetch(`${BASE_PATH}/data/latest-videos.json`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (Array.isArray(data.videos)) setLiveVideos(data.videos);
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
      })
      .catch(() => {});
    fetch(`${BASE_PATH}/data/discovered-videos.json`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (Array.isArray(data.videos)) setDiscoveredVideos(data.videos); })
      .catch(() => {});
    fetch(`${BASE_PATH}/data/news.json`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (Array.isArray(data.news)) setNews(data.news); if (data.updatedAt) setNewsUpdatedAt(data.updatedAt); })
      .catch(() => {});
    fetch(`${BASE_PATH}/data/podcasts.json`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (!Array.isArray(data.podcasts)) return;
        setPodcastArtwork(Object.fromEntries(data.podcasts.map((item: { appleId: string; artworkUrl: string; appleUrl: string }) => [item.appleId, { artworkUrl: item.artworkUrl, appleUrl: item.appleUrl }])));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("clarity-theme", theme); } catch {}
  }, [theme]);

  const categories = useMemo(() => ["Todos", ...userInterests, "Minha biblioteca"], [userInterests]);

  const videos = useMemo(() => {
    const all = [...customVideos, ...webVideos, ...discoveredVideos, ...liveVideos, ...seedVideos];
    return all.filter((video, index) => all.findIndex((item) => item.youtubeId === video.youtubeId) === index);
  }, [customVideos, webVideos, discoveredVideos, liveVideos]);

  const ranked = useMemo(() => {
    return rankVideos(videos, preferences).filter((video) => {
      const categoryMatch = category === "Todos" || video.category === category;
      const text = `${video.title} ${video.channel} ${video.topic} ${video.category}`.toLowerCase();
      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      return categoryMatch && terms.every((term) => text.includes(term));
    }).sort((a, b) => (b.score + seededNoise(b.id, refreshSeed) * 5) - (a.score + seededNoise(a.id, refreshSeed) * 5));
  }, [videos, preferences, category, query, refreshSeed]);

  const visiblePodcasts = useMemo(() => podcasts.map((podcast) => ({ ...podcast, ...podcastArtwork[podcast.appleId] }))
    .filter((podcast) => category === "Todos" || podcast.category === category)
    .sort((a, b) => Math.abs(a.depth - preferences.depth / 100) - Math.abs(b.depth - preferences.depth / 100)), [category, preferences.depth, podcastArtwork]);

  const homeReadings = useMemo(() => {
    const levelOrder = { Essencial: 0, Intermediário: 1, Avançado: 2 };
    return readings
      .filter((reading) => category === "Todos" || reading.category === category)
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Math.abs(levelOrder[a.level] - levelOrder[languageLevel]) - Math.abs(levelOrder[b.level] - levelOrder[languageLevel]))
      .slice(0, 8);
  }, [category, languageLevel]);

  const visibleNews = useMemo(() => {
    const cutoff = currentTime - (newsPeriod === "today" ? 30 : 7 * 24) * 3_600_000;
    const candidates = news.filter((item) => Date.parse(item.publishedAt) >= cutoff)
      .filter((item) => category === "Todos" ? userInterests.includes(item.category) : item.category === category);
    const categoryCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};
    return candidates.filter((item) => {
      const categoryLimit = category === "Todos" ? 2 : 8;
      if ((categoryCount[item.category] || 0) >= categoryLimit || (sourceCount[item.source] || 0) >= 2) return false;
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      sourceCount[item.source] = (sourceCount[item.source] || 0) + 1;
      return true;
    }).slice(0, 8);
  }, [news, newsPeriod, category, userInterests, currentTime]);

  async function refreshRecommendations() {
    setRefreshing(true);
    try {
      const [response, discoveries, headlines] = await Promise.all([
        fetch(`${BASE_PATH}/data/latest-videos.json?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`${BASE_PATH}/data/discovered-videos.json?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`${BASE_PATH}/data/news.json?t=${Date.now()}`, { cache: "no-store" }),
      ]);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.videos)) setLiveVideos(data.videos);
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
      }
      if (discoveries.ok) {
        const data = await discoveries.json();
        if (Array.isArray(data.videos)) setDiscoveredVideos(data.videos);
      }
      if (headlines.ok) {
        const data = await headlines.json();
        if (Array.isArray(data.news)) setNews(data.news);
        if (data.updatedAt) setNewsUpdatedAt(data.updatedAt);
      }
    } catch {}
    setRefreshSeed(Date.now());
    setVisibleCount(12);
    setRefreshing(false);
  }

  async function searchYouTube(key = searchApiKey) {
    const searchTerm = query.trim();
    if (!searchTerm) { setWebSearchStatus("Digite um assunto antes de pesquisar."); return; }
    if (!key) { setShowSearchSetup(true); return; }
    setWebSearching(true);
    setWebSearchStatus("Pesquisando e avaliando resultados…");
    try {
      const searchParams = new URLSearchParams({ part: "snippet", type: "video", maxResults: "25", order: "relevance", safeSearch: "moderate", videoEmbeddable: "true", videoSyndicated: "true", relevanceLanguage: "pt", regionCode: "BR", q: searchTerm, key });
      const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
      if (!searchResponse.ok) throw new Error(String(searchResponse.status));
      const searchData = await searchResponse.json();
      const ids = (searchData.items || []).map((item: { id?: { videoId?: string } }) => item.id?.videoId).filter(Boolean);
      if (!ids.length) throw new Error("empty");
      const detailParams = new URLSearchParams({ part: "snippet,contentDetails,statistics,status", id: ids.join(","), key });
      const detailResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`);
      if (!detailResponse.ok) throw new Error(String(detailResponse.status));
      const detailData = await detailResponse.json();
      const shallow = /#shorts|\bshorts?\b|cortes?\s+(do|de|podcast)|urgente|chocante|você não vai acreditar|treta/i;
      const educational = /aula|curso|explic|fundamento|document|palestra|análise|história|lecture|explained|documentary|strategy|science/i;
      const selectedCategory = category === "Todos" || category === "Minha biblioteca" ? "Ideias" : category;
      const found: Video[] = (detailData.items || []).map((item: { id: string; snippet: { title: string; channelTitle: string; publishedAt: string; liveBroadcastContent?: string }; contentDetails?: { duration?: string }; statistics?: { viewCount?: string; likeCount?: string }; status?: { embeddable?: boolean } }, index: number) => {
        const seconds = isoDurationSeconds(item.contentDetails?.duration);
        if (seconds < 241 || seconds > 10_800 || shallow.test(item.snippet.title) || item.snippet.liveBroadcastContent !== "none" || item.status?.embeddable === false) return null;
        const views = Number(item.statistics?.viewCount || 0);
        const likes = Number(item.statistics?.likeCount || 0);
        const reception = views > 0 ? Math.min(.08, (likes / views) * 14) : 0;
        const learningBonus = educational.test(item.snippet.title) ? .09 : 0;
        return { id: `web-${item.id}`, youtubeId: item.id, thumbnailId: item.id, embedType: "video", publishedAt: item.snippet.publishedAt, category: selectedCategory, title: item.snippet.title, channel: item.snippet.channelTitle, topic: searchTerm.toLowerCase(), url: `https://www.youtube.com/watch?v=${item.id}`, durationSeconds: seconds, depth: Math.min(.96, .65 + Math.min(.22, seconds / 15_000) + learningBonus), novelty: Math.max(.58, .9 - index * .02), quality: Math.min(.96, .72 + learningBonus + reception), evergreen: .8, publishedLabel: relativeDate(item.snippet.publishedAt), palette: (["blue", "coral", "ink", "moss", "violet", "sand"] as const)[index % 6], mark: "PESQUISA" };
      }).filter(Boolean) as Video[];
      setWebVideos(found);
      setRefreshSeed(Date.now());
      setVisibleCount(20);
      setWebSearchStatus(found.length ? `${found.length} vídeos longos passaram pelo filtro local.` : "Nenhum resultado passou pelo filtro de qualidade e duração.");
    } catch (error) {
      setWebSearchStatus(error instanceof Error && error.message === "403" ? "A chave foi recusada ou atingiu a cota. Verifique a YouTube Data API v3." : "A pesquisa online não pôde ser concluída agora.");
    } finally {
      setWebSearching(false);
    }
  }

  function saveSearchKey(formData: FormData) {
    const key = String(formData.get("apiKey") || "").trim();
    if (!key) return;
    setSearchApiKey(key);
    try { localStorage.setItem("clarity-youtube-api-key", key); } catch {}
    setShowSearchSetup(false);
    void searchYouTube(key);
  }

  function clearSearchKey() {
    setSearchApiKey("");
    setWebVideos([]);
    setWebSearchStatus("");
    try { localStorage.removeItem("clarity-youtube-api-key"); } catch {}
  }

  function changeLanguageLevel(level: "Essencial" | "Intermediário" | "Avançado") {
    const targets = { Essencial: 42, Intermediário: 70, Avançado: 92 };
    setLanguageLevel(level);
    try { localStorage.setItem("clarity-language-level", level); } catch {}
    persistPreferences({ ...preferences, depth: targets[level] });
  }

  function persistInterests(next: string[]) {
    const unique = next.filter((item, index) => item && next.indexOf(item) === index);
    setUserInterests(unique);
    try { localStorage.setItem("clarity-interests", JSON.stringify(unique)); } catch {}
    if (category !== "Todos" && category !== "Minha biblioteca" && !unique.includes(category)) setCategory("Todos");
  }

  function completeOnboarding() {
    if (!userInterests.length) return;
    persistInterests(userInterests);
    try { localStorage.setItem("clarity-onboarding-complete", "true"); } catch {}
    setShowOnboarding(false);
  }

  function addInterest(formData: FormData) {
    const label = String(formData.get("interest") || "").trim().slice(0, 30);
    if (!label) return;
    persistInterests([...userInterests, label]);
    setCategory(label);
    setQuery(label);
    setShowInterestManager(false);
  }

  function persistPreferences(next: Preferences) {
    setPreferences(next);
    try { localStorage.setItem("clarity-preferences", JSON.stringify(next)); } catch {}
  }

  function feedback(id: string, value: 1 | -1) {
    const video = videos.find((item) => item.id === id);
    if (!video) return;
    const topicWeights = { ...preferences.topicWeights };
    topicWeights[video.topic] = Math.max(-3, Math.min(3, (topicWeights[video.topic] || 0) + value));
    persistPreferences({ ...preferences, topicWeights });
  }

  function finishVideo() {
    if (!playing) return;
    const next = [...watchedBlock, playing.title];
    setPlaying(null);
    if (next.length >= 2) {
      setReflectionVideos(next);
      setWatchedBlock([]);
      setActiveArticle(articles[articleIndex % articles.length]);
      setArticleIndex((value) => value + 1);
    } else {
      setWatchedBlock(next);
    }
  }

  function addVideo(formData: FormData) {
    const url = String(formData.get("url") || "");
    if (/youtube\.com\/shorts\//i.test(url)) {
      setAddError("Shorts não entram no Clarity. Adicione um vídeo ou aula em formato normal.");
      return;
    }
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{6,})/);
    if (!match) {
      setAddError("Não foi possível reconhecer esse link do YouTube.");
      return;
    }
    const next: Video = {
      id: `custom-${match[1]}`,
      youtubeId: match[1],
      category: "Minha biblioteca",
      title: String(formData.get("title") || "Vídeo da minha biblioteca"),
      channel: "Minha biblioteca",
      topic: String(formData.get("topic") || "estudo").toLowerCase(),
      url,
      durationSeconds: 900,
      depth: .75,
      novelty: .6,
      quality: .8,
      evergreen: .85,
      publishedLabel: "adicionado agora",
      palette: "coral",
      mark: "SALVO",
    };
    const nextVideos = [next, ...customVideos.filter((video) => video.id !== next.id)];
    setCustomVideos(nextVideos);
    try { localStorage.setItem("clarity-videos", JSON.stringify(nextVideos)); } catch {}
    setShowAdd(false);
    setAddError("");
    setCategory("Minha biblioteca");
  }

  function saveReflection() {
    if (!activeArticle) return;
    const date = new Date();
    const entry = { date: date.toISOString(), videos: reflectionVideos, article: activeArticle.title, summary, principle, connections, evidence, application };
    let entries = [entry];
    try {
      const previous = JSON.parse(localStorage.getItem("clarity-journal") || "[]");
      entries = [...previous, entry];
      localStorage.setItem("clarity-journal", JSON.stringify(entries));
    } catch {}
    const today = date.toISOString().slice(0, 10);
    const daily = entries.filter((item: typeof entry) => item.date.slice(0, 10) === today);
    const markdown = `# Diário de aprendizado — ${today}\n\n${daily.map((item: typeof entry, index: number) => `## Bloco ${index + 1}\n\n### Vídeos\n${item.videos.map((title: string) => `- ${title}`).join("\n")}\n\n### Leitura\n- ${item.article}\n\n### 1. Explicação simples — método Feynman\n${item.summary}\n\n### 2. Tronco e galhos — primeiros princípios\n${item.principle}\n\n### 3. Pontos conectados e foco\n${item.connections || "—"}\n\n### 4. Evidências, dúvidas e contrapontos\n${item.evidence || "—"}\n\n### 5. Aplicação e teste\n${item.application}`).join("\n\n---\n\n")}`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `clarity-diario-${today}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setActiveArticle(null);
    setSummary(""); setPrinciple(""); setConnections(""); setEvidence(""); setApplication("");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-group">
          <button className="icon-button menu-button" aria-label="Abrir menu">☰</button>
          <a className="brand" href="#top"><span className="brand-mark">C</span><strong>Clarity</strong><sup>BR</sup></a>
        </div>
        <div className="search-box">
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchYouTube(); }} placeholder="Pesquisar aqui ou descobrir na internet" aria-label="Pesquisar vídeos" />
          <button className="web-search-button" onClick={() => void searchYouTube()} disabled={webSearching || !query.trim()} aria-label="Pesquisar novos vídeos na internet" title="Pesquisar novos vídeos na internet">{webSearching ? "…" : "⌕+"}</button>
        </div>
        <div className="header-actions">
          <button className="create-button" onClick={() => { setAddError(""); setShowAdd(true); }}>＋ Criar</button>
          <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema">{theme === "dark" ? "☀" : "◐"}</button>
          <span className="avatar" aria-hidden="true">C</span>
        </div>
      </header>

      <aside className="sidebar">
        <nav>
          <button className={category === "Todos" ? "nav-item active" : "nav-item"} onClick={() => setCategory("Todos")}><span>⌂</span>Início</button>
          <a className="nav-item" href={`${BASE_PATH}/leituras/`}><span>▤</span>Leituras</a>
          <button className="nav-item" onClick={() => document.getElementById("noticias")?.scrollIntoView()}><span>◫</span>Notícias</button>
          <button className="nav-item" onClick={() => setCategory("Minha biblioteca")}><span>▱</span>Minha biblioteca</button>
        </nav>
        <div className="side-separator" />
        <p className="side-label">EXPLORAR</p>
        {userInterests.map((item) => <button key={item} className={category === item ? "nav-item active" : "nav-item"} onClick={() => { setCategory(item); setVisibleCount(12); }}><span>{interestIcon(item)}</span>{item}</button>)}
        <button className="nav-item manage-interests" onClick={() => setShowInterestManager(true)}><span>＋</span>Editar interesses</button>
        <div className="side-separator" />
        <div className="focus-card"><strong>Modo intencional</strong><p>Sem autoplay e sem feed infinito. A cada 2 vídeos, uma leitura.</p><span>{watchedBlock.length}/2 neste bloco</span></div>
      </aside>

      <main className="content" id="top">
        <div className="chip-row">
          {categories.map((item) => <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => { setCategory(item); setVisibleCount(12); }}>{item}</button>)}
        </div>

        <section className="feed-heading">
          <div><p className="eyebrow">SELEÇÃO EXPLICÁVEL</p><h1>{category === "Todos" ? "Vídeos que valem seu tempo" : category}</h1><p>O algoritmo roda no seu dispositivo e prioriza profundidade, diversidade e valor formativo.</p></div>
          <div className="heading-actions">
            {updatedAt && <span className="live-badge"><i /> atualizado {new Date(updatedAt).toLocaleDateString("pt-BR")}</span>}
            <button className={refreshing ? "refresh-button loading" : "refresh-button"} onClick={refreshRecommendations} disabled={refreshing}><span>↻</span>{refreshing ? "Atualizando" : "Recarregar"}</button>
            <button className="tune-button" onClick={() => setShowControls(!showControls)}>⚙ Ajustar algoritmo</button>
          </div>
        </section>

        {showControls && <section className="algorithm-panel">
          <div><strong>Seu algoritmo</strong><p>Nenhum clique oculto decide por você. Ajuste os critérios conscientemente.</p></div>
          <div className="language-control"><span>Complexidade da linguagem</span><div>{(["Essencial", "Intermediário", "Avançado"] as const).map((level) => <button key={level} className={languageLevel === level ? "active" : ""} onClick={() => changeLanguageLevel(level)}>{level}</button>)}</div></div>
          <label>Profundidade <output>{preferences.depth}%</output><input type="range" min="0" max="100" value={preferences.depth} onChange={(event) => persistPreferences({ ...preferences, depth: Number(event.target.value) })} /></label>
          <label>Descoberta <output>{preferences.discovery}%</output><input type="range" min="0" max="100" value={preferences.discovery} onChange={(event) => persistPreferences({ ...preferences, discovery: Number(event.target.value) })} /></label>
          <label>Duração máxima <output>{preferences.maxMinutes} min</output><input type="range" min="8" max="120" value={preferences.maxMinutes} onChange={(event) => persistPreferences({ ...preferences, maxMinutes: Number(event.target.value) })} /></label>
        </section>}

        {webSearchStatus && <div className="web-search-status"><span>⌕</span><p>{webSearchStatus}</p>{searchApiKey && <button onClick={() => setShowSearchSetup(true)}>Configurar busca</button>}</div>}

        <div className="top-discovery">
          <section className="news-section compact-news" id="noticias">
            <div className="section-heading news-heading"><div><p className="eyebrow">RADAR DO DIA</p><h2>Notícias com contexto</h2></div><div className="period-control"><button className={newsPeriod === "today" ? "active" : ""} onClick={() => setNewsPeriod("today")}>Hoje</button><button className={newsPeriod === "week" ? "active" : ""} onClick={() => setNewsPeriod("week")}>Semana</button></div></div>
            {visibleNews.length ? <div className="news-grid">{visibleNews.slice(0, 4).map((item, index) => <article className="news-card" key={item.id}><div><span>{item.category}</span><time>{relativeDate(item.publishedAt)}</time></div><span className="news-number">{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.source}</p><a href={item.url} target="_blank" rel="noreferrer">Ler notícia ↗</a></article>)}</div> : <div className="news-empty"><strong>Nenhuma notícia neste período.</strong><p>{newsPeriod === "today" ? "Veja a seleção da semana." : "A atualização ainda está preparando este tema."}</p></div>}
            {newsUpdatedAt && <small className="news-update">Atualizado {new Date(newsUpdatedAt).toLocaleDateString("pt-BR")}</small>}
          </section>

          {visiblePodcasts.length > 0 && <section className="podcast-section compact-podcasts" aria-labelledby="podcasts-title">
            <div className="section-heading"><div><p className="eyebrow">OUÇA SEM PRESSA</p><h2 id="podcasts-title">Podcasts</h2></div><span>Apple Podcasts</span></div>
            <div className="podcast-grid">{visiblePodcasts.slice(0, 4).map((podcast) => <PodcastCard key={podcast.id} podcast={podcast} onPlay={setPlayingPodcast} />)}</div>
          </section>}
        </div>

        {ranked.length ? <section className="video-grid">
          {ranked.slice(0, Math.min(8, visibleCount)).map((video) => <VideoCard key={video.id} video={video} onPlay={setPlaying} onFeedback={feedback} />)}
        </section> : <div className="empty-state"><strong>Nenhum vídeo encontrado</strong><p>Tente outro filtro ou termo de busca.</p></div>}

        {ranked.length > 8 && visibleCount > 8 && <section className="video-grid second-grid">
          {ranked.slice(8, visibleCount).map((video) => <VideoCard key={video.id} video={video} onPlay={setPlaying} onFeedback={feedback} />)}
        </section>}

        {visibleCount < ranked.length && <button className="load-more" onClick={() => setVisibleCount((value) => value + 8)}>Mostrar mais vídeos</button>}

        <section className="reading-section" id="leituras">
          <div className="reading-intro"><p className="eyebrow">LEITURAS PARA FORMAR REPERTÓRIO</p><h2>Uma estante, não outro feed</h2><p>Artigos, livros, documentos e pesquisas selecionados para construir fundamentos e ligar ideias.</p><a className="library-link" href={`${BASE_PATH}/leituras/`}>Abrir biblioteca completa →</a></div>
          <div className="reading-shelf">{homeReadings.map((reading) => <article className="reading-card" key={reading.id}><div><span className={`reading-type type-${reading.type.replace(" ", "-").toLowerCase()}`}>{reading.type}</span><span>{reading.level}</span></div><h3>{reading.title}</h3><p>{reading.description}</p><small>{reading.author} · {reading.source} · {reading.readTime}</small><blockquote>{reading.question}</blockquote><a href={reading.url} target="_blank" rel="noreferrer">Ler na fonte ↗</a></article>)}</div>
        </section>

        <section className="guided-reading-section">
          <div><p className="eyebrow">PAUSAS GUIADAS</p><h2>Leia e ensine de volta</h2><p>Estas leituras curtas abrem o formulário de síntese usado depois de cada dois vídeos.</p></div>
          <div className="article-grid">{articles.map((article, index) => <button key={article.title} onClick={() => { setReflectionVideos([]); setActiveArticle(article); }}><span>0{index + 1}</span><small>{article.kicker}</small><strong>{article.title}</strong><em>Ler e resumir →</em></button>)}</div>
        </section>
      </main>

      {playing && <div className="overlay player-overlay">
        <section className="player-modal" role="dialog" aria-modal="true" aria-label={playing.title}>
          <div className="player-top"><div><span>{playing.category}</span><strong>{playing.title}</strong></div><button onClick={finishVideo} aria-label="Fechar vídeo">×</button></div>
          <div className="player-frame"><iframe src={embedUrl(playing)} title={playing.title} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
          <div className="player-meta"><div className="channel-avatar">{playing.channel.slice(0, 1)}</div><div><strong>{playing.channel}</strong><p>{playing.explanation}</p></div><a href={playing.url} target="_blank" rel="noreferrer">Abrir no YouTube ↗</a></div>
          <button className="finish-button" onClick={finishVideo}>Concluir e voltar ao feed</button>
        </section>
      </div>}

      {playingPodcast && <div className="overlay player-overlay" onMouseDown={() => setPlayingPodcast(null)}>
        <section className="player-modal podcast-modal" role="dialog" aria-modal="true" aria-label={playingPodcast.title} onMouseDown={(event) => event.stopPropagation()}>
          <div className="player-top"><div><span>{playingPodcast.category} · Apple Podcasts</span><strong>{playingPodcast.title}</strong></div><button onClick={() => setPlayingPodcast(null)} aria-label="Fechar podcast">×</button></div>
          <div className="podcast-frame"><iframe src={podcastEmbed(playingPodcast, theme)} title={playingPodcast.title} allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" /></div>
          <div className="podcast-modal-copy"><strong>{playingPodcast.author}</strong><p>{playingPodcast.description}</p><span>Nível {levelLabel(playingPodcast.depth)} · {Math.round(playingPodcast.clarity * 100)}% clareza editorial</span></div>
        </section>
      </div>}

      {showOnboarding && <div className="overlay onboarding-overlay"><section className="setup-modal" role="dialog" aria-modal="true" aria-label="Configurar o Clarity"><p className="eyebrow">PRIMEIRO ACESSO</p><h2>O que merece sua atenção?</h2><p>Escolha seus temas. O Clarity usará somente essas escolhas explícitas — você poderá alterá-las quando quiser.</p><div className="setup-interests">{defaultInterests.map((item) => <button key={item.label} className={userInterests.includes(item.label) ? "selected" : ""} onClick={() => persistInterests(userInterests.includes(item.label) ? userInterests.filter((interest) => interest !== item.label) : [...userInterests, item.label])}><span>{item.icon}</span>{item.label}<i>{userInterests.includes(item.label) ? "✓" : "+"}</i></button>)}</div><div className="setup-preferences"><div><label>Complexidade inicial</label><div className="setup-levels">{(["Essencial", "Intermediário", "Avançado"] as const).map((item) => <button key={item} className={languageLevel === item ? "active" : ""} onClick={() => changeLanguageLevel(item)}>{item}</button>)}</div></div><label>Profundidade <output>{preferences.depth}%</output><input type="range" min="20" max="100" value={preferences.depth} onChange={(event) => persistPreferences({ ...preferences, depth: Number(event.target.value) })} /></label></div><button className="setup-submit" disabled={!userInterests.length} onClick={completeOnboarding}>Criar meu Clarity</button><small>Sem autoplay, sem Shorts e sem perfil de publicidade.</small></section></div>}

      {showInterestManager && <div className="overlay" onMouseDown={() => setShowInterestManager(false)}><section className="small-modal interest-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setShowInterestManager(false)}>×</button><p className="eyebrow">SEUS INTERESSES</p><h2>Personalizar temas</h2><div className="interest-list">{userInterests.map((item) => <div key={item}><span>{interestIcon(item)}</span><strong>{item}</strong><button onClick={() => persistInterests(userInterests.filter((interest) => interest !== item))} aria-label={`Remover ${item}`}>×</button></div>)}</div><form action={addInterest}><label>Novo assunto<input name="interest" required maxLength={30} placeholder="Ex.: arquitetura, direito, música" /></label><button type="submit">＋ Adicionar interesse</button></form><p className="modal-note">Ao selecionar um tema novo, use a busca ⌕+ para descobrir vídeos na internet.</p></section></div>}

      {showSearchSetup && <div className="overlay" onMouseDown={() => setShowSearchSetup(false)}><section className="small-modal search-setup-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setShowSearchSetup(false)}>×</button><p className="eyebrow">PESQUISA EM TEMPO REAL</p><h2>Conectar busca do YouTube</h2><p>A chave fica somente neste navegador e não entra no repositório. Para segurança, restrinja-a ao seu domínio e à YouTube Data API v3.</p><form action={saveSearchKey}><label>Chave pessoal da API<input name="apiKey" type="password" required defaultValue={searchApiKey} placeholder="AIza…" autoComplete="off" /></label><button type="submit">Salvar e pesquisar agora</button>{searchApiKey && <button className="secondary-form-button" type="button" onClick={clearSearchKey}>Remover chave deste dispositivo</button>}</form><a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer">Abrir configuração oficial da API ↗</a><p className="modal-note">Para a atualização autônoma do site público, adicione a mesma chave como segredo <b>YOUTUBE_API_KEY</b> no GitHub.</p></section></div>}

      {showAdd && <div className="overlay" onMouseDown={() => setShowAdd(false)}><section className="small-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setShowAdd(false)}>×</button><p className="eyebrow">MINHA BIBLIOTECA</p><h2>Adicionar vídeo</h2><form action={addVideo}><label>Link do YouTube<input name="url" type="url" required placeholder="https://youtube.com/watch?v=…" /></label><label>Título<input name="title" required placeholder="Título do vídeo" /></label><label>Tema<input name="topic" required placeholder="Ex.: economia" /></label>{addError && <p className="form-error">{addError}</p>}<button type="submit">Guardar e assistir aqui</button></form></section></div>}

      {activeArticle && <div className="overlay reading-overlay"><article className="reader" role="dialog" aria-modal="true">{reflectionVideos.length < 2 && <button className="reader-close" onClick={() => setActiveArticle(null)} aria-label="Fechar leitura">×</button>}<p className="eyebrow">{activeArticle.kicker}</p><h2>{activeArticle.title}</h2>{activeArticle.paragraphs.map((text) => <p key={text}>{text}</p>)}<blockquote>{activeArticle.principle}</blockquote><div className="reflection"><p className="eyebrow">SÍNTESE OBRIGATÓRIA</p><h3>Reconstrua o que aprendeu</h3><p>{summaryPrompt(languageLevel)} O roteiro combina explicação simples, fundamentos, conexão entre ideias, leitura crítica e aplicação.</p><div className="learning-methods"><span><b>Feynman</b> explique</span><span><b>Musk</b> encontre o tronco</span><span><b>Jobs</b> conecte e simplifique</span><span><b>Gates</b> questione evidências</span></div><label>1. Explicação simples<textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Sem jargões: qual é a ideia central e como ela funciona?" /></label><label>2. Tronco e galhos — princípios fundamentais<textarea value={principle} onChange={(event) => setPrinciple(event.target.value)} placeholder="Liste as verdades básicas das quais os detalhes dependem." /></label><label>3. Pontos conectados e foco<textarea value={connections} onChange={(event) => setConnections(event.target.value)} placeholder="Com que outra ideia isso se conecta? O que é essencial e o que pode ser cortado?" /></label><label>4. Evidências, dúvidas e contrapontos<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Que evidência sustenta a conclusão? O que ainda não está claro? O que mudaria sua opinião?" /></label><label>5. Aplicação ou experimento concreto<textarea value={application} onChange={(event) => setApplication(event.target.value)} placeholder="O que você fará, testará ou explicará nas próximas 24 horas?" /></label><button disabled={summary.trim().length < 50 || principle.trim().length < 30 || connections.trim().length < 30 || evidence.trim().length < 30 || application.trim().length < 20} onClick={saveReflection}>Salvar resumo em Markdown e continuar</button></div></article></div>}
    </div>
  );
}
