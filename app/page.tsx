"use client";
/* eslint-disable @next/next/no-img-element -- capas e thumbnails vêm de CDNs oficiais em uma exportação estática */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { seedVideos, type Video } from "../lib/videos";
import { DEFAULT_PREFERENCES, diversifyVideos, feedbackTraits, rankVideos, videoRejectionReason, type Preferences, type RankedVideo } from "../lib/recommender";
import { readings } from "../lib/readings";
import { studyFeedVideos } from "../lib/study";
import { supabase } from "../lib/supabase";
import AIStudyDock from "./components/AIStudyDock";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const RECOMMENDATION_HISTORY_KEY = "clarity-recommendation-history";
const LAST_RECOMMENDATIONS_KEY = "clarity-last-recommendations";
const RECOMMENDATION_CYCLE_KEY = "clarity-recommendation-cycle";
const RECOMMENDATION_BATCH_SIZE = 20;
const RECOMMENDATION_HISTORY_LIMIT = 60;
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
type PoliticalSpectrum = "Esquerda" | "Centro" | "Direita";

type ContentAudit = {
  approved: boolean;
  method?: "semantic-content" | "unavailable";
  overall: number;
  depth: number;
  insight: number;
  evidence: number;
  captivating: number;
  thesis: string;
  reasons: string[];
  auditedAt: string;
};

type AuditState = "approved" | "rejected" | "pending";

function auditState(audit?: ContentAudit): AuditState {
  if (!audit || audit.method !== "semantic-content") return "pending";
  return audit.approved ? "approved" : "rejected";
}

type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
  spectrum?: PoliticalSpectrum;
};

type YouTubeSearchVideo = {
  id: string;
  snippet: {
    title: string;
    description?: string;
    channelTitle: string;
    publishedAt: string;
    liveBroadcastContent?: string;
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string };
  status?: { embeddable?: boolean };
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

type SearchFunctionResponse = {
  items?: YouTubeSearchVideo[];
  news?: NewsItem[];
  podcasts?: Podcast[];
  meta?: { videosExamined?: number; newsExamined?: number; podcastsExamined?: number };
  warnings?: string[];
  error?: string;
};

type InterestFeed = { updatedAt: string; videos: Video[] };

const podcasts: Podcast[] = [
  { id: "nova-acropole", appleId: "1347139874", slug: "nova-acropole-podcast-filosofia", title: "Nova Acrópole Podcast Filosofia", author: "Nova Acrópole do Brasil", category: "Ideias", description: "Filosofia clássica aplicada ao cotidiano, com linguagem progressiva e exemplos concretos.", depth: .9, clarity: .91, accent: "#8267e8" },
  { id: "filosofia-pop", appleId: "991572436", slug: "filosofia-pop", title: "Filosofia Pop", author: "Filosofia Pop", category: "Ideias", description: "Conversas longas que conectam filosofia, cultura, política e experiência brasileira.", depth: .94, clarity: .78, accent: "#3677d8" },
  { id: "petit-journal", appleId: "1193387182", slug: "petit-journal", title: "Petit Journal", author: "Daniel Sousa e Tanguy Baghdadi", category: "Mundo", description: "Economia e política internacional explicadas por professores, com contexto histórico.", depth: .82, clarity: .94, accent: "#d64848" },
  { id: "os-socios", appleId: "1553427360", slug: "os-sócios-podcast", title: "Os Sócios Podcast", author: "Grupo Primo", category: "Negócios", description: "Negócios, dinheiro e desenvolvimento pessoal em conversas acessíveis e extensas.", depth: .78, clarity: .9, accent: "#d59d2a" },
  { id: "christo", appleId: "1455626095", slug: "christo-nihil-praeponere", title: "Christo Nihil Praeponere", author: "Padre Paulo Ricardo", category: "Fé", description: "Formação espiritual diária a partir do Evangelho e da tradição católica.", depth: .86, clarity: .94, accent: "#9f7549" },
  { id: "cafe-brasil", appleId: "191182582", slug: "canal-café-brasil", title: "Canal Café Brasil", author: "Luciano Pires", category: "Mundo", description: "Comportamento, cidadania, política e cultura para exercitar autonomia de pensamento.", depth: .76, clarity: .9, accent: "#a74463" },
  { id: "acquired", appleId: "1050462261", slug: "acquired", title: "Acquired", author: "Ben Gilbert e David Rosenthal", category: "Negócios", description: "Histórias profundamente pesquisadas sobre as empresas e estratégias que moldaram mercados inteiros.", depth: .96, clarity: .86, accent: "#5b6ff0" },
  { id: "knowledge-project", appleId: "990149481", slug: "the-knowledge-project", title: "The Knowledge Project", author: "Shane Parrish", category: "Ideias", description: "Modelos mentais, decisões e aprendizado explicados por pensadores e operadores experientes.", depth: .9, clarity: .88, accent: "#be8c52" },
  { id: "hidden-brain", appleId: "1028908750", slug: "hidden-brain", title: "Hidden Brain", author: "Shankar Vedantam", category: "Ideias", description: "Ciência do comportamento e natureza humana em narrativas claras, práticas e bem documentadas.", depth: .82, clarity: .96, accent: "#cf5368" },
  { id: "startalk", appleId: "325404506", slug: "startalk-radio", title: "StarTalk Radio", author: "Neil deGrasse Tyson", category: "Ciência", description: "Astronomia, física e exploração espacial traduzidas em conversas acessíveis sem perder rigor.", depth: .74, clarity: .95, accent: "#295c9d" },
  { id: "rest-history", appleId: "1537788786", slug: "the-rest-is-history", title: "The Rest Is History", author: "Tom Holland e Dominic Sandbrook", category: "Mundo", description: "Grandes processos históricos reconstruídos com contexto, fontes e conexões com o presente.", depth: .86, clarity: .92, accent: "#b94335" },
  { id: "rest-politics", appleId: "1611374685", slug: "the-rest-is-politics", title: "The Rest Is Politics", author: "Alastair Campbell e Rory Stewart", category: "Política", description: "Política internacional explicada por perspectivas divergentes e experiência institucional.", depth: .8, clarity: .88, accent: "#6a4ba0" },
  { id: "econtalk", appleId: "135066958", slug: "econtalk", title: "EconTalk", author: "Russ Roberts", category: "Negócios", description: "Economia, instituições e escolhas humanas em diálogos longos que valorizam objeções e evidências.", depth: .94, clarity: .85, accent: "#744a87" },
  { id: "conversations-tyler", appleId: "983795625", slug: "conversations-with-tyler", title: "Conversations with Tyler", author: "Tyler Cowen", category: "Ideias", description: "Conversas exigentes sobre economia, cultura, tecnologia e as ideias que movem pessoas excepcionais.", depth: .96, clarity: .74, accent: "#8b6939" },
  { id: "mindscape", appleId: "1406534739", slug: "sean-carrolls-mindscape-science-society-philosophy", title: "Sean Carroll's Mindscape", author: "Sean Carroll", category: "Ciência", description: "Ciência, filosofia e sociedade tratadas do fundamento técnico às consequências intelectuais.", depth: .98, clarity: .78, accent: "#315d78" },
  { id: "pints-aquinas", appleId: "1097862282", slug: "pints-with-aquinas", title: "Pints With Aquinas", author: "Matt Fradd", category: "Fé", description: "Filosofia tomista, teologia e vida católica em debates longos com convidados diversos.", depth: .85, clarity: .86, accent: "#8b5b35" },
  { id: "bible-year", appleId: "1539568321", slug: "the-bible-in-a-year-with-fr-mike-schmitz", title: "The Bible in a Year", author: "Fr. Mike Schmitz", category: "Fé", description: "Leitura bíblica guiada com contexto histórico, oração e explicações progressivas.", depth: .72, clarity: .97, accent: "#a34f3d" },
  { id: "lex-fridman", appleId: "1434243584", slug: "lex-fridman-podcast", title: "Lex Fridman Podcast", author: "Lex Fridman", category: "Ideias", description: "Conversas extensas sobre ciência, tecnologia, história, poder e natureza humana.", depth: .92, clarity: .76, accent: "#4d4d4d" },
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

const SEARCH_STOP_WORDS = new Set(["a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas", "para", "por", "com", "como", "que", "um", "uma", "sobre", "ao", "aos"]);
const ATTENTION_TRAP = /\b(shorts?|cortes? (do|de) podcast|treta|fofoca|pegadinha|prank|tente nao rir|reacao|reaction|compilacao|melhores momentos|urgente|chocante|voce nao vai acreditar|ninguem te conta|humilhou|destruiu|lacrou|mitou|exposed|ganhe dinheiro (facil|rapido)|fique rico rapido)\b/i;
const LEARNING_SIGNAL = /\b(aula|curso|explica|explicacao|fundamentos?|documentario|palestra|analise|historia|guia|tutorial|estrategia|ciencia|estudo|entrevista|debate|como|por que|porque|o que e|introducao|lecture|explained|documentary|strategy|science|history|guide)\b/i;
const EVIDENCE_SIGNAL = /\b(evidencia|evidence|fontes|sources|referencias|references|bibliografia|pesquisa|research|estudo de caso|case study|demonstracao|demonstration|dados|data)\b/i;

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function meaningfulSearchTerms(value: string) {
  const terms = normalizeSearchText(value).split(/\s+/).filter((term) => term.length >= 2 && !SEARCH_STOP_WORDS.has(term));
  return terms.length ? [...new Set(terms)] : normalizeSearchText(value).split(/\s+/).filter(Boolean);
}

function searchTermAppears(text: string, term: string) {
  return text.includes(term) || (term.length > 4 && term.endsWith("s") && text.includes(term.slice(0, -1)));
}

function searchRejectionReason(item: YouTubeSearchVideo, searchTerm: string, seconds: number) {
  if (seconds < 241 || seconds > 10_800) return "duracao";
  if ((item.snippet.liveBroadcastContent && item.snippet.liveBroadcastContent !== "none") || item.status?.embeddable === false) return "indisponivel";

  const title = normalizeSearchText(item.snippet.title);
  const description = normalizeSearchText(item.snippet.description || "");
  const channel = normalizeSearchText(item.snippet.channelTitle);
  const context = `${title} ${description} ${channel}`;
  if (ATTENTION_TRAP.test(title)) return "distracao";

  const terms = meaningfulSearchTerms(searchTerm);
  const titleHits = terms.filter((term) => searchTermAppears(title, term)).length;
  const contextHits = terms.filter((term) => searchTermAppears(context, term)).length;
  const requiredHits = terms.length <= 2 ? 1 : Math.ceil(terms.length * .6);
  const exactTitleMatch = title.includes(normalizeSearchText(searchTerm));
  const focusedTitle = exactTitleMatch || titleHits >= Math.min(2, terms.length);
  if (contextHits < requiredHits || (!focusedTitle && contextHits < terms.length)) return "relevancia";
  if (!LEARNING_SIGNAL.test(`${title} ${description}`) && seconds < 480) return "densidade";
  return null;
}

function relativeDate(publishedAt: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000));
  if (days === 0) return "publicado hoje";
  if (days < 30) return `há ${days} dias`;
  if (days < 365) return `há ${Math.floor(days / 30)} meses`;
  const years = Math.floor(days / 365);
  return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}

function updateTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário indisponível";
  return `${date.toLocaleDateString("pt-BR")} • ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
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

function storedRecommendationIds(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function paginate<T>(items: T[], pageSize: number, maxPages = 3) {
  return Array.from({ length: Math.min(maxPages, Math.ceil(items.length / pageSize)) }, (_, index) => items.slice(index * pageSize, (index + 1) * pageSize));
}

function interestIcon(label: string) {
  return defaultInterests.find((item) => item.label === label)?.icon || "◆";
}

function summaryPrompt(level: "Essencial" | "Intermediário" | "Avançado") {
  if (level === "Essencial") return "Explique com palavras simples, como se ensinasse a alguém que nunca viu o tema.";
  if (level === "Avançado") return "Defina a tese, o mecanismo causal, as evidências, as objeções e os limites da ideia.";
  return "Explique a ideia central, como ela funciona e por que ela importa, sem copiar frases da fonte.";
}

function PodcastCard({ podcast, onPlay, pending = false }: { podcast: Podcast; onPlay: (podcast: Podcast) => void; pending?: boolean }) {
  return (
    <article className="podcast-card">
      <button className="podcast-art" style={{ background: `linear-gradient(145deg, ${podcast.accent}, #111)` }} onClick={() => onPlay(podcast)} aria-label={`Ouvir ${podcast.title}`}>
        {podcast.artworkUrl ? <img src={podcast.artworkUrl} alt={`Capa oficial de ${podcast.title}`} loading="lazy" /> : <span className="podcast-fallback">◖))</span>}<span className="podcast-play">▶</span>
      </button>
      <div className="podcast-copy"><p>{podcast.category} · {levelLabel(podcast.depth)}</p>{pending && <span className="audit-badge">em auditoria</span>}<button onClick={() => onPlay(podcast)}>{podcast.title}</button><span>{podcast.author}</span><small>{podcast.description}</small><em>{Math.round(podcast.clarity * 100)}% clareza editorial</em>{podcast.appleUrl && <a href={podcast.appleUrl} target="_blank" rel="noreferrer">Ver no Apple Podcasts ↗</a>}</div>
    </article>
  );
}

function ContentCarousel({ pages, pageClassName, label }: { pages: ReactNode[][]; pageClassName: string; label: string }) {
  const [activePage, setActivePage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const pageCount = pages.length;
  const currentPage = Math.min(activePage, Math.max(0, pageCount - 1));

  function move(direction: -1 | 1) {
    setActivePage((current) => Math.max(0, Math.min(pageCount - 1, Math.min(current, pageCount - 1) + direction)));
  }

  if (!pageCount) return null;
  return (
    <div className="content-carousel" role="region" aria-roledescription="carrossel" aria-label={label}>
      <div
        className="carousel-viewport"
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStart === null) return;
          const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
          if (Math.abs(distance) >= 45) move(distance < 0 ? 1 : -1);
          setTouchStart(null);
        }}
      >
        <div className="carousel-track" style={{ transform: `translateX(-${currentPage * 100}%)` }}>
          {pages.map((page, index) => <div className={`carousel-page ${pageClassName}`} key={index} aria-hidden={index !== currentPage} inert={index !== currentPage}>{page}</div>)}
        </div>
      </div>
      {pageCount > 1 && <div className="carousel-navigation">
        <button className="carousel-arrow" onClick={() => move(-1)} disabled={currentPage === 0} aria-label={`Página anterior de ${label}`}>‹</button>
        <div className="carousel-dots" aria-label={`Página ${currentPage + 1} de ${pageCount}`}>
          {pages.map((_, index) => <button key={index} className={index === currentPage ? "active" : ""} onClick={() => setActivePage(index)} aria-label={`Mostrar página ${index + 1} de ${label}`} aria-current={index === currentPage ? "true" : undefined} />)}
        </div>
        <button className="carousel-arrow" onClick={() => move(1)} disabled={currentPage === pageCount - 1} aria-label={`Próxima página de ${label}`}>›</button>
      </div>}
    </div>
  );
}

function VideoCard({ video, onPlay, onFeedback, feedback = 0, pending = false }: {
  video: RankedVideo;
  onPlay: (video: RankedVideo) => void;
  onFeedback: (youtubeId: string, value: 1 | -1) => void;
  feedback?: -1 | 0 | 1;
  pending?: boolean;
}) {
  const image = thumbnail(video);
  return (
    <article className="video-card">
      <button className={`thumbnail visual-${video.palette}`} onClick={() => onPlay(video)} aria-label={`Assistir ${video.title}`}>
        {image ? <img src={image} alt="" loading="lazy" /> : <span className="thumbnail-mark">{video.mark}</span>}
        {pending && <span className="audit-badge audit-badge-overlay">em auditoria</span>}
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
            <button className={feedback === 1 ? "active" : ""} aria-pressed={feedback === 1} onClick={() => onFeedback(video.youtubeId, 1)}>＋ mais assim</button>
            <button className={feedback === -1 ? "active negative" : ""} aria-pressed={feedback === -1} onClick={() => onFeedback(video.youtubeId, -1)}>− menos assim</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function DepthVideoCard({ video, onPlay, pending = false }: { video: RankedVideo; onPlay: (video: RankedVideo) => void; pending?: boolean }) {
  const image = thumbnail(video);
  return (
    <article className="depth-video-card">
      <button className={`depth-thumbnail visual-${video.palette}`} onClick={() => onPlay(video)} aria-label={`Assistir ${video.title}`}>
        {image ? <img src={image} alt="" loading="lazy" /> : <span className="thumbnail-mark">{video.mark}</span>}
        {pending && <span className="audit-badge audit-badge-overlay">em auditoria</span>}
        <span className="thumbnail-play">▶</span>
        <span className="duration">{video.embedType === "playlist" ? "coleção" : durationLabel(video.durationSeconds)}</span>
      </button>
      <div><span>{video.category} · {video.topic}</span><button onClick={() => onPlay(video)}>{video.title}</button><small>{video.channel}</small></div>
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
  const [interestFeeds, setInterestFeeds] = useState<Record<string, InterestFeed>>({});
  const [searchedNews, setSearchedNews] = useState<NewsItem[]>([]);
  const [searchedPodcasts, setSearchedPodcasts] = useState<Podcast[]>([]);
  const [completedSearch, setCompletedSearch] = useState("");
  const [customVideos, setCustomVideos] = useState<Video[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [playing, setPlaying] = useState<RankedVideo | null>(null);
  const [playingPodcast, setPlayingPodcast] = useState<Podcast | null>(null);
  const [podcastArtwork, setPodcastArtwork] = useState<Record<string, { artworkUrl: string; appleUrl: string }>>({});
  const [contentAudits, setContentAudits] = useState<Record<string, ContentAudit>>({});
  const [showControls, setShowControls] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compactCarousel, setCompactCarousel] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInterestManager, setShowInterestManager] = useState(false);
  const [addError, setAddError] = useState("");
  const [webSearching, setWebSearching] = useState(false);
  const [webSearchStatus, setWebSearchStatus] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string | null>(null);
  const [newsPeriod, setNewsPeriod] = useState<"today" | "week">("today");
  const [newsSpectrum, setNewsSpectrum] = useState<"Todos" | PoliticalSpectrum>("Todos");
  const [visibleCount, setVisibleCount] = useState(RECOMMENDATION_BATCH_SIZE);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [recentRecommendationIds, setRecentRecommendationIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; previous: Preferences } | null>(null);
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
      const storedInterests = localStorage.getItem("clarity-interests");
      const storedInterestFeeds = localStorage.getItem("clarity-interest-feeds");
      const storedRecommendationHistory = storedRecommendationIds(localStorage.getItem(RECOMMENDATION_HISTORY_KEY));
      const lastRecommendations = storedRecommendationIds(localStorage.getItem(LAST_RECOMMENDATIONS_KEY));
      const storedRecommendationCycle = Number(localStorage.getItem(RECOMMENDATION_CYCLE_KEY));
      const nextRecommendationHistory = Array.from(new Set([...storedRecommendationHistory, ...lastRecommendations])).slice(-RECOMMENDATION_HISTORY_LIMIT);
      const nextRecommendationCycle = Number.isSafeInteger(storedRecommendationCycle) && storedRecommendationCycle >= 0 ? storedRecommendationCycle + 1 : 1;
      const requestedCategory = new URLSearchParams(window.location.search).get("tema");
      queueMicrotask(() => {
        if (storedTheme) setTheme(storedTheme);
        if (storedPrefs) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) });
        if (storedVideos) setCustomVideos(JSON.parse(storedVideos));
        if (storedLevel) setLanguageLevel(storedLevel);
        if (storedInterests) setUserInterests(JSON.parse(storedInterests));
        if (storedInterestFeeds) setInterestFeeds(JSON.parse(storedInterestFeeds));
        setRecentRecommendationIds(nextRecommendationHistory);
        setRefreshSeed(nextRecommendationCycle);
        if (requestedCategory && defaultInterestLabels.includes(requestedCategory)) setCategory(requestedCategory);
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
    fetch(`${BASE_PATH}/data/content-audits.json`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (data?.audits && typeof data.audits === "object") setContentAudits(data.audits); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("clarity-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(RECOMMENDATION_HISTORY_KEY, JSON.stringify(recentRecommendationIds));
      localStorage.setItem(RECOMMENDATION_CYCLE_KEY, String(refreshSeed));
    } catch {}
  }, [recentRecommendationIds, refreshSeed]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)");
    const syncLayout = () => setCompactCarousel(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  const categories = useMemo(() => ["Todos", ...userInterests, "Minha biblioteca"], [userInterests]);
  const contentSearchActive = Boolean(completedSearch && normalizeSearchText(query) === normalizeSearchText(completedSearch));

  const videoCandidates = useMemo(() => {
    const personalized = Object.values(interestFeeds).flatMap((feed) => Array.isArray(feed?.videos) ? feed.videos : []);
    const all = [...customVideos, ...webVideos, ...personalized, ...discoveredVideos, ...liveVideos, ...studyFeedVideos, ...seedVideos];
    return all.filter((video, index) => {
      if (all.findIndex((item) => item.youtubeId === video.youtubeId) !== index) return false;
      if (video.category === "Minha biblioteca") return true;
      return auditState(contentAudits[`video:${video.youtubeId}`]) !== "rejected" && !videoRejectionReason(video);
    });
  }, [customVideos, webVideos, interestFeeds, discoveredVideos, liveVideos, contentAudits]);

  const videos = useMemo(() => videoCandidates.filter((video) => (
    preferences.videoFeedback?.[video.youtubeId] !== -1
    && (video.category === "Minha biblioteca" || auditState(contentAudits[`video:${video.youtubeId}`]) === "approved")
  )), [videoCandidates, contentAudits, preferences.videoFeedback]);

  const pendingVideos = useMemo(() => {
    const candidates = rankVideos(videoCandidates.filter((video) => (
      video.category !== "Minha biblioteca"
      && auditState(contentAudits[`video:${video.youtubeId}`]) === "pending"
      && preferences.videoFeedback?.[video.youtubeId] !== -1
    )), preferences).filter((video) => {
      const categoryMatch = category === "Todos" || video.category === category;
      const text = `${video.title} ${video.channel} ${video.topic} ${video.category}`.toLowerCase();
      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      return categoryMatch && terms.every((term) => text.includes(term));
    });
    return diversifyVideos(candidates).slice(0, 8);
  }, [videoCandidates, contentAudits, preferences, category, query]);

  const ranked = useMemo(() => {
    const candidates = rankVideos(videos, preferences).filter((video) => {
      const categoryMatch = category === "Todos" || video.category === category;
      const text = `${video.title} ${video.channel} ${video.topic} ${video.category}`.toLowerCase();
      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      return categoryMatch && terms.every((term) => text.includes(term));
    });

    if (candidates.length < 2) return candidates;

    const recentIds = new Set(recentRecommendationIds);
    const scoreSpan = Math.max(1, candidates[0].score - candidates[candidates.length - 1].score);
    const rotationRange = Math.min(1.5, Math.max(.5, scoreSpan * .04));
    const recentPenalty = Math.min(12, Math.max(6, scoreSpan * .3));

    const rotated = candidates.sort((a, b) => {
      const scoreA = a.score + seededNoise(a.youtubeId, refreshSeed + 1) * rotationRange - (recentIds.has(a.youtubeId) ? recentPenalty : 0);
      const scoreB = b.score + seededNoise(b.youtubeId, refreshSeed + 1) * rotationRange - (recentIds.has(b.youtubeId) ? recentPenalty : 0);
      return scoreB - scoreA || b.score - a.score || a.title.localeCompare(b.title);
    });
    return diversifyVideos(rotated);
  }, [videos, preferences, category, query, refreshSeed, recentRecommendationIds]);

  useEffect(() => {
    if (!ranked.length) return;
    try {
      localStorage.setItem(LAST_RECOMMENDATIONS_KEY, JSON.stringify(ranked.slice(0, RECOMMENDATION_BATCH_SIZE).map((video) => video.youtubeId)));
    } catch {}
  }, [ranked]);

  const depthLanes = useMemo(() => [
    {
      id: "basic",
      eyebrow: "BÁSICO",
      title: "Construa os fundamentos",
      description: "Conceitos, vocabulário e intuição para entrar no assunto sem pressupor conhecimento anterior.",
      videos: ranked.filter((video) => video.depth < .68).slice(0, 6),
    },
    {
      id: "intermediate",
      eyebrow: "INTERMEDIÁRIO",
      title: "Entenda os mecanismos",
      description: "Relações de causa e efeito, casos concretos e conexões entre as ideias centrais.",
      videos: ranked.filter((video) => video.depth >= .68 && video.depth < .86).slice(0, 6),
    },
    {
      id: "deep",
      eyebrow: "PROFUNDO",
      title: "Questione, compare e aplique",
      description: "Evidências, objeções, limites e aplicações para formar uma visão própria e defensável.",
      videos: ranked.filter((video) => video.depth >= .86).slice(0, 6),
    },
  ], [ranked]);

  const visiblePodcasts = useMemo(() => {
    const candidates = contentSearchActive ? searchedPodcasts : podcasts.map((podcast) => ({ ...podcast, ...podcastArtwork[podcast.appleId] }));
    return candidates
      .filter((podcast) => auditState(contentAudits[`podcast:${podcast.appleId}`]) === "approved")
      .filter((podcast) => contentSearchActive || category === "Todos" || podcast.category === category)
      .sort((a, b) => Math.abs(a.depth - preferences.depth / 100) - Math.abs(b.depth - preferences.depth / 100));
  }, [category, preferences.depth, podcastArtwork, contentSearchActive, searchedPodcasts, contentAudits]);

  const pendingPodcastsCount = useMemo(() => {
    const candidates = contentSearchActive ? searchedPodcasts : podcasts;
    return candidates.filter((podcast) => (
      auditState(contentAudits[`podcast:${podcast.appleId}`]) === "pending"
      && (contentSearchActive || category === "Todos" || podcast.category === category)
    )).length;
  }, [category, contentSearchActive, searchedPodcasts, contentAudits]);

  const homeReadings = useMemo(() => {
    const levelOrder = { Essencial: 0, Intermediário: 1, Avançado: 2 };
    return readings
      .filter((reading) => category === "Todos" || reading.category === category)
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Math.abs(levelOrder[a.level] - levelOrder[languageLevel]) - Math.abs(levelOrder[b.level] - levelOrder[languageLevel]))
      .slice(0, 8);
  }, [category, languageLevel]);

  const visibleNews = useMemo(() => {
    const cutoff = currentTime - (newsPeriod === "today" ? 30 : 7 * 24) * 3_600_000;
    const sourceNews = contentSearchActive ? searchedNews : news;
    const candidates = sourceNews.filter((item) => auditState(contentAudits[`news:${item.url}`]) === "approved")
      .filter((item) => Date.parse(item.publishedAt) >= cutoff)
      .filter((item) => newsSpectrum === "Todos" || (item.spectrum || "Centro") === newsSpectrum)
      .filter((item) => contentSearchActive || (category === "Todos" ? userInterests.includes(item.category) : item.category === category));
    const categoryCount: Record<string, number> = {};
    return candidates.filter((item) => {
      const categoryLimit = contentSearchActive ? 12 : category === "Todos" ? 2 : 8;
      if ((categoryCount[item.category] || 0) >= categoryLimit) return false;
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      return true;
    }).slice(0, 12);
  }, [news, searchedNews, contentSearchActive, newsPeriod, newsSpectrum, category, userInterests, currentTime, contentAudits]);

  const pendingNewsCount = useMemo(() => {
    const cutoff = currentTime - (newsPeriod === "today" ? 30 : 7 * 24) * 3_600_000;
    const sourceNews = contentSearchActive ? searchedNews : news;
    return sourceNews.filter((item) => (
      auditState(contentAudits[`news:${item.url}`]) === "pending"
      && Date.parse(item.publishedAt) >= cutoff
      && (newsSpectrum === "Todos" || (item.spectrum || "Centro") === newsSpectrum)
      && (contentSearchActive || (category === "Todos" ? userInterests.includes(item.category) : item.category === category))
    )).length;
  }, [news, searchedNews, contentSearchActive, newsPeriod, newsSpectrum, category, userInterests, currentTime, contentAudits]);

  const pendingAuditCount = pendingVideos.length + pendingNewsCount + pendingPodcastsCount;
  const semanticAuditCount = Object.values(contentAudits).filter((audit) => audit.method === "semantic-content").length;
  const approvedAuditCount = Object.values(contentAudits).filter((audit) => audit.method === "semantic-content" && audit.approved).length;

  const newsPages = useMemo(() => paginate(visibleNews, compactCarousel ? 2 : 4), [visibleNews, compactCarousel]);
  const podcastPages = useMemo(() => paginate(visiblePodcasts, compactCarousel ? 2 : 6), [visiblePodcasts, compactCarousel]);

  async function refreshRecommendations() {
    if (refreshing) return;

    const currentlyVisible = ranked.slice(0, Math.min(RECOMMENDATION_BATCH_SIZE, visibleCount)).map((video) => video.youtubeId);
    setRecentRecommendationIds((current) => Array.from(new Set([...current, ...currentlyVisible])).slice(-RECOMMENDATION_HISTORY_LIMIT));
    setRefreshSeed((current) => current + 1);
    setVisibleCount(RECOMMENDATION_BATCH_SIZE);
    setRefreshing(true);
    setRefreshStatus("");

    const cacheBuster = Date.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8_000);
    try {
      const [latestResult, discoveriesResult, headlinesResult, podcastsResult, auditsResult] = await Promise.allSettled([
        fetch(`${BASE_PATH}/data/latest-videos.json?t=${cacheBuster}`, { cache: "no-store", signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()),
        fetch(`${BASE_PATH}/data/discovered-videos.json?t=${cacheBuster}`, { cache: "no-store", signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()),
        fetch(`${BASE_PATH}/data/news.json?t=${cacheBuster}`, { cache: "no-store", signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()),
        fetch(`${BASE_PATH}/data/podcasts.json?t=${cacheBuster}`, { cache: "no-store", signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()),
        fetch(`${BASE_PATH}/data/content-audits.json?t=${cacheBuster}`, { cache: "no-store", signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()),
      ]);

      let changed = false;
      let successfulRequests = 0;

      if (latestResult.status === "fulfilled") {
        successfulRequests += 1;
        const data = latestResult.value;
        if (Array.isArray(data.videos)) {
          changed ||= data.videos.map((video: Video) => video.youtubeId).join("|") !== liveVideos.map((video) => video.youtubeId).join("|");
          setLiveVideos(data.videos);
        }
        if (data.updatedAt) {
          changed ||= data.updatedAt !== updatedAt;
          setUpdatedAt(data.updatedAt);
        }
      }
      if (discoveriesResult.status === "fulfilled") {
        successfulRequests += 1;
        const data = discoveriesResult.value;
        if (Array.isArray(data.videos)) {
          changed ||= data.videos.map((video: Video) => video.youtubeId).join("|") !== discoveredVideos.map((video) => video.youtubeId).join("|");
          setDiscoveredVideos(data.videos);
        }
      }
      if (headlinesResult.status === "fulfilled") {
        successfulRequests += 1;
        const data = headlinesResult.value;
        if (Array.isArray(data.news)) {
          changed ||= data.news.map((item: NewsItem) => item.url).join("|") !== news.map((item) => item.url).join("|");
          setNews(data.news);
        }
        if (data.updatedAt) {
          changed ||= data.updatedAt !== newsUpdatedAt;
          setNewsUpdatedAt(data.updatedAt);
        }
      }
      if (podcastsResult.status === "fulfilled") {
        successfulRequests += 1;
        const data = podcastsResult.value;
        if (Array.isArray(data.podcasts)) {
          const nextArtwork: Record<string, { artworkUrl: string; appleUrl: string }> = Object.fromEntries(data.podcasts.map((item: { appleId: string; artworkUrl: string; appleUrl: string }) => [item.appleId, { artworkUrl: item.artworkUrl, appleUrl: item.appleUrl }]));
          changed ||= JSON.stringify(nextArtwork) !== JSON.stringify(podcastArtwork);
          setPodcastArtwork(nextArtwork);
        }
      }
      if (auditsResult.status === "fulfilled") {
        successfulRequests += 1;
        const data = auditsResult.value;
        if (data?.audits && typeof data.audits === "object") {
          changed ||= JSON.stringify(data.audits) !== JSON.stringify(contentAudits);
          setContentAudits(data.audits);
        }
      }

      setRefreshStatus(successfulRequests === 0
        ? "Não foi possível consultar as atualizações. Verifique a conexão e tente novamente."
        : successfulRequests < 5
          ? `Consulta parcial: ${successfulRequests} de 5 fontes responderam. Tente novamente em instantes.`
          : changed
            ? "Novos dados carregados, incluindo as auditorias mais recentes da Groq."
            : "Tudo conferido: ainda não há uma atualização nova publicada.");
    } finally {
      window.clearTimeout(timeoutId);
      setRefreshing(false);
    }
  }

  async function searchContent(searchOverride?: string, targetCategory?: string) {
    const searchTerm = (searchOverride ?? query).trim();
    if (!searchTerm) { setWebSearchStatus("Digite um assunto antes de pesquisar."); return; }
    if (!supabase) { setWebSearchStatus("A pesquisa segura aguarda a conexão com o Supabase."); return; }
    if (searchOverride) setQuery(searchTerm);
    setWebSearching(true);
    setWebSearchStatus(targetCategory ? `Preparando o campo “${targetCategory}” com aulas e vídeos relevantes…` : "Pesquisando e avaliando resultados…");
    try {
      const { data, error: functionError } = await supabase.functions.invoke<SearchFunctionResponse>("search-youtube", { body: { query: searchTerm } });
      if (functionError) {
        const response = (functionError as { context?: Response }).context;
        const details = response ? await response.clone().json().catch(() => null) as { error?: string } | null : null;
        throw new Error(details?.error || functionError.message);
      }
      if (data?.error) throw new Error(data.error);
      const resultNews = Array.isArray(data?.news) ? data.news : [];
      const resultPodcasts = Array.isArray(data?.podcasts) ? data.podcasts : [];
      setSearchedNews(resultNews);
      setSearchedPodcasts(resultPodcasts);
      setCompletedSearch(searchTerm);
      setNewsPeriod("week");
      const selectedCategory = targetCategory || (category === "Todos" || category === "Minha biblioteca" ? "Ideias" : category);
      const candidates = Array.isArray(data?.items) ? data.items : [];
      const rejected = { duracao: 0, indisponivel: 0, distracao: 0, relevancia: 0, densidade: 0, qualidade: 0, excesso: 0 };
      const approved = candidates.map((item, index) => {
        const seconds = isoDurationSeconds(item.contentDetails?.duration);
        const rejectionReason = searchRejectionReason(item, searchTerm, seconds);
        if (rejectionReason) {
          rejected[rejectionReason] += 1;
          return null;
        }
        const views = Number(item.statistics?.viewCount || 0);
        const likes = Number(item.statistics?.likeCount || 0);
        const reception = views > 0 ? Math.min(.08, (likes / views) * 14) : 0;
        const normalizedTitle = normalizeSearchText(item.snippet.title);
        const normalizedDescription = normalizeSearchText(item.snippet.description || "");
        const terms = meaningfulSearchTerms(searchTerm);
        const titleCoverage = terms.filter((term) => searchTermAppears(normalizedTitle, term)).length / Math.max(1, terms.length);
        const normalizedContext = `${normalizedTitle} ${normalizedDescription}`;
        const contextCoverage = terms.filter((term) => searchTermAppears(normalizedContext, term)).length / Math.max(1, terms.length);
        const learningBonus = LEARNING_SIGNAL.test(`${normalizedTitle} ${normalizedDescription}`) ? .06 : 0;
        const evidenceBonus = EVIDENCE_SIGNAL.test(normalizedContext) ? .09 : 0;
        const descriptionBonus = normalizedDescription.length >= 280 ? .06 : normalizedDescription.length >= 120 ? .03 : 0;
        const relevanceBonus = Math.min(.08, titleCoverage * .05 + contextCoverage * .03);
        const video: Video = { id: `web-${item.id}`, youtubeId: item.id, thumbnailId: item.id, embedType: "video", publishedAt: item.snippet.publishedAt, category: selectedCategory, title: item.snippet.title, channel: item.snippet.channelTitle, topic: searchTerm.toLowerCase(), url: `https://www.youtube.com/watch?v=${item.id}`, durationSeconds: seconds, depth: Math.min(.96, .62 + Math.min(.22, seconds / 15_000) + evidenceBonus), novelty: Math.max(.58, .9 - index * .02), quality: Math.min(.96, .62 + learningBonus + evidenceBonus + descriptionBonus + relevanceBonus + Math.min(.06, reception)), evergreen: .8, publishedLabel: relativeDate(item.snippet.publishedAt), palette: (["blue", "coral", "ink", "moss", "violet", "sand"] as const)[index % 6], mark: "PESQUISA" };
        if (videoRejectionReason(video)) {
          rejected.qualidade += 1;
          return null;
        }
        return video;
      }).filter(Boolean) as Video[];

      rejected.excesso = Math.max(0, approved.length - 36);
      const found = approved.slice(0, 36);
      setWebVideos(found);
      if (targetCategory && found.length) {
        setInterestFeeds((current) => {
          const next = { ...current, [targetCategory]: { updatedAt: new Date().toISOString(), videos: found } };
          try { localStorage.setItem("clarity-interest-feeds", JSON.stringify(next)); } catch {}
          return next;
        });
      }
      setRefreshSeed((current) => current + 1);
      setVisibleCount(36);
      const removed = candidates.length - found.length;
      const removalSummary = [
        rejected.relevancia && `${rejected.relevancia} fora do assunto`,
        rejected.distracao && `${rejected.distracao} isca de atenção`,
        rejected.densidade && `${rejected.densidade} de baixa densidade`,
        rejected.qualidade && `${rejected.qualidade} sem sinais suficientes de qualidade`,
        rejected.duracao && `${rejected.duracao} fora da duração`,
        rejected.indisponivel && `${rejected.indisponivel} indisponível`,
        rejected.excesso && `${rejected.excesso} além do limite consciente`,
      ].filter(Boolean).join(" · ");
      const sourceWarning = data?.warnings?.length ? " Uma das fontes ficou temporariamente indisponível." : "";
      setWebSearchStatus(
        `Filtro de atenção: ${found.length} vídeos, ${resultNews.length} notícias e ${resultPodcasts.length} podcasts aprovados.${removalSummary ? ` Vídeos removidos: ${removalSummary}.` : removed ? ` ${removed} vídeos removidos.` : ""}${sourceWarning}`,
      );
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const messages: Record<string, string> = {
        missing_api_key: "A pesquisa aguarda a chave YOUTUBE_API_KEY nos Secrets da função do Supabase.",
        daily_limit: "O limite consciente de pesquisas das últimas 24 horas foi atingido. Tente novamente amanhã.",
        access_denied: "Seu período de acesso não permite novas pesquisas.",
        youtube_quota: "A cota diária da YouTube Data API foi atingida.",
        invalid_session: "Sua sessão expirou. Entre novamente.",
      };
      setWebSearchStatus(messages[code] || "A pesquisa segura não pôde ser concluída agora.");
    } finally {
      setWebSearching(false);
    }
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

  function openCategory(nextCategory: string) {
    setMobileMenuOpen(false);
    setCategory(nextCategory);
    setVisibleCount(RECOMMENDATION_BATCH_SIZE);
    setQuery("");
    setCompletedSearch("");
    if (nextCategory === "Todos" || nextCategory === "Minha biblioteca" || defaultInterestLabels.includes(nextCategory)) return;
    const cached = interestFeeds[nextCategory];
    const stale = !cached?.updatedAt || Date.now() - Date.parse(cached.updatedAt) >= 3_600_000;
    if (stale && !webSearching) void searchContent(nextCategory, nextCategory);
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
    setVisibleCount(24);
    setCompletedSearch("");
    setShowInterestManager(false);
    void searchContent(label, label);
  }

  function persistPreferences(next: Preferences) {
    setPreferences(next);
    try { localStorage.setItem("clarity-preferences", JSON.stringify(next)); } catch {}
  }

  function feedback(youtubeId: string, value: 1 | -1) {
    const video = videoCandidates.find((item) => item.youtubeId === youtubeId);
    if (!video) return;
    const previous = preferences;
    const currentValue = preferences.videoFeedback?.[youtubeId] ?? 0;
    const nextValue = currentValue === value ? 0 : value;
    const delta = nextValue - currentValue;
    const topicWeights = { ...preferences.topicWeights };
    topicWeights[video.topic] = Math.max(-3, Math.min(3, (topicWeights[video.topic] || 0) + delta));
    const traitWeights = { ...(preferences.traitWeights || {}) };
    for (const trait of feedbackTraits(video)) traitWeights[trait] = Math.max(-3, Math.min(3, (traitWeights[trait] || 0) + delta));
    const videoFeedback = { ...(preferences.videoFeedback || {}) };
    if (nextValue === 0) delete videoFeedback[youtubeId];
    else videoFeedback[youtubeId] = nextValue;
    persistPreferences({ ...preferences, topicWeights, traitWeights, videoFeedback });
    setFeedbackNotice({
      previous,
      message: nextValue === -1
        ? `“${video.title}” foi removido. Tema, categoria, profundidade e duração terão menos peso — o canal não foi penalizado.`
        : nextValue === 1
          ? `Entendido: conteúdos semelhantes a “${video.title}” terão mais peso, sem favorecer automaticamente o canal.`
          : `O feedback sobre “${video.title}” foi removido.`,
    });
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
          <button className="icon-button menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileMenuOpen} aria-controls="main-sidebar">☰</button>
          <a className="brand" href="#top"><span className="brand-mark">C</span><strong>Clarity</strong><sup>BR</sup></a>
        </div>
        <div className="search-box">
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchContent(); }} placeholder="Pesquisar com filtro de atenção" aria-label="Pesquisar vídeos, notícias e podcasts com filtro de atenção" />
          <button className="web-search-button" onClick={() => void searchContent()} disabled={webSearching || !query.trim()} aria-label="Pesquisar conteúdos relevantes na internet" title="Pesquisar vídeos, notícias e podcasts com filtro de relevância e profundidade">{webSearching ? "…" : "⌕+"}</button>
        </div>
        <div className="header-actions">
          <button className="create-button" onClick={() => { setAddError(""); setShowAdd(true); }}>＋ Criar</button>
          <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema">{theme === "dark" ? "☀" : "◐"}</button>
          <span className="avatar" aria-hidden="true">C</span>
        </div>
      </header>

      {mobileMenuOpen && <button className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu de temas" />}
      <aside className={mobileMenuOpen ? "sidebar mobile-open" : "sidebar"} id="main-sidebar">
        <div className="mobile-sidebar-head"><strong>Navegar e explorar</strong><button onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">×</button></div>
        <nav>
          <button className={category === "Todos" ? "nav-item active" : "nav-item"} onClick={() => openCategory("Todos")}><span>⌂</span>Início</button>
          <a className="nav-item" href={`${BASE_PATH}/estudo/`}><span>⌘</span>Modo Estudo</a>
          <a className="nav-item" href={`${BASE_PATH}/leituras/`}><span>▤</span>Leituras</a>
          <button className="nav-item" onClick={() => { setMobileMenuOpen(false); document.getElementById("noticias")?.scrollIntoView(); }}><span>◫</span>Notícias</button>
          <button className="nav-item" onClick={() => openCategory("Minha biblioteca")}><span>▱</span>Minha biblioteca</button>
        </nav>
        <div className="side-separator" />
        <p className="side-label">EXPLORAR</p>
        {userInterests.map((item) => <button key={item} className={category === item ? "nav-item active" : "nav-item"} onClick={() => openCategory(item)}><span>{interestIcon(item)}</span>{item}{!defaultInterestLabels.includes(item) && <small className="interest-count">{interestFeeds[item]?.videos?.length || "⌕"}</small>}</button>)}
        <button className="nav-item manage-interests" onClick={() => { setMobileMenuOpen(false); setShowInterestManager(true); }}><span>＋</span>Editar interesses</button>
        <div className="side-separator" />
        <AIStudyDock embedded />
        <div className="focus-card"><strong>Modo intencional</strong><p>Sem autoplay e sem feed infinito. A cada 2 vídeos, uma leitura.</p><span>{watchedBlock.length}/2 neste bloco</span></div>
      </aside>

      <main className="content" id="top">
        <div className="chip-row">
          {categories.map((item) => <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => openCategory(item)}>{item}</button>)}
        </div>

        <section className="feed-heading">
          <div><p className="eyebrow">SELEÇÃO EXPLICÁVEL</p><h1>{category === "Todos" ? "Vídeos que valem seu tempo" : category}</h1><p>O algoritmo roda no seu dispositivo e prioriza profundidade, diversidade e valor formativo.</p></div>
          <div className="heading-actions">
            {updatedAt && <span className="live-badge" title="Data e horário local da última atualização"><i /> atualizado {updateTimestamp(updatedAt)}</span>}
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

        {refreshStatus && <div className="web-search-status" role="status" aria-live="polite"><span>↻</span><p>{refreshStatus}</p><button onClick={() => setRefreshStatus("")} aria-label="Fechar aviso de atualização">Fechar</button></div>}
        {feedbackNotice && <div className="web-search-status feedback-notice" role="status" aria-live="polite"><span>✓</span><p>{feedbackNotice.message}</p><button onClick={() => { persistPreferences(feedbackNotice.previous); setFeedbackNotice(null); }}>Desfazer</button></div>}
        {webSearchStatus && <div className="web-search-status"><span>⌕</span><p>{webSearchStatus}</p></div>}
        <div className="audit-notice"><span>◷</span><p><strong>Feed aprovado pela Groq.</strong> {semanticAuditCount} conteúdo{semanticAuditCount === 1 ? " foi avaliado" : "s foram avaliados"} semanticamente e {approvedAuditCount} {approvedAuditCount === 1 ? "foi aprovado" : "foram aprovados"}. {pendingAuditCount > 0 && `${pendingAuditCount} itens visíveis neste filtro continuam apenas na fila de auditoria.`}</p></div>

        <div className="top-discovery">
          <section className="news-section compact-news" id="noticias">
            <div className="section-heading news-heading"><div><p className="eyebrow">{contentSearchActive ? "PESQUISA COM CONTEXTO" : "RADAR DO DIA"}</p><h2>{contentSearchActive ? `Notícias sobre “${completedSearch}”` : "Notícias com contexto"}</h2></div><div className="news-controls"><div className="period-control"><button className={newsPeriod === "today" ? "active" : ""} onClick={() => setNewsPeriod("today")}>Hoje</button><button className={newsPeriod === "week" ? "active" : ""} onClick={() => setNewsPeriod("week")}>Semana</button></div><label>Fonte<select value={newsSpectrum} onChange={(event) => setNewsSpectrum(event.target.value as "Todos" | PoliticalSpectrum)}><option>Todos</option><option>Esquerda</option><option>Centro</option><option>Direita</option></select></label></div></div>
            {visibleNews.length ? <ContentCarousel key={`${newsPeriod}-${newsSpectrum}-${category}-${completedSearch}-${compactCarousel}`} label="Notícias com contexto" pageClassName="news-grid" pages={newsPages.map((page, pageIndex) => page.map((item, index) => <article className="news-card" key={item.id}><div><span>{item.category}</span><time>{relativeDate(item.publishedAt)}</time></div><span className="news-number">{String(pageIndex * (compactCarousel ? 2 : 4) + index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.source}<span className={`spectrum-badge spectrum-${(item.spectrum || "Centro").toLowerCase()}`} title="Orientação editorial aproximada da fonte; não da matéria individual">{item.spectrum || "Centro"}</span></p><a href={item.url} target="_blank" rel="noreferrer">Ler notícia ↗</a></article>))} /> : <div className="news-empty"><strong>A Groq ainda não aprovou nenhuma notícia para este filtro.</strong><p>{pendingNewsCount > 0 ? `${pendingNewsCount} notícias aguardam análise de conteúdo.` : "Veja a seleção da semana ou outro espectro."}</p></div>}
            <div className="news-meta">{(contentSearchActive || newsUpdatedAt) && <small className="news-update">{contentSearchActive ? "Pesquisa filtrada agora" : `Atualizado ${updateTimestamp(newsUpdatedAt!)}`}</small>}<small>Espectro = orientação aproximada da fonte, não da matéria.</small></div>
          </section>

          {(visiblePodcasts.length > 0 || pendingPodcastsCount > 0 || contentSearchActive) && <section className="podcast-section compact-podcasts" aria-labelledby="podcasts-title">
            <div className="section-heading"><div><p className="eyebrow">{contentSearchActive ? "PODCASTS SOBRE O TEMA" : "OUÇA SEM PRESSA"}</p><h2 id="podcasts-title">{contentSearchActive ? completedSearch : "Podcasts"}</h2></div><span>Apple Podcasts</span></div>
            {visiblePodcasts.length ? <ContentCarousel key={`${category}-${completedSearch}`} label="Podcasts selecionados" pageClassName="podcast-grid" pages={podcastPages.map((page) => page.map((podcast) => <PodcastCard key={podcast.id} podcast={podcast} onPlay={setPlayingPodcast} />))} /> : <div className="news-empty"><strong>A Groq ainda não aprovou nenhum podcast para este filtro.</strong><p>{pendingPodcastsCount > 0 ? `${pendingPodcastsCount} podcasts aguardam análise de conteúdo.` : "A busca não encontrou candidatos para esta combinação."}</p></div>}
          </section>}
        </div>

        {ranked.length > 0 && <section className="depth-section" aria-labelledby="depth-title">
          <div className="depth-heading"><div><p className="eyebrow">APRENDA EM CAMADAS</p><h2 id="depth-title">Escolha a profundidade certa para hoje</h2></div><p>Comece pelo tronco, avance pelos mecanismos e só então mergulhe nas discussões mais exigentes.</p></div>
          <div className="depth-lanes">{depthLanes.map((lane) => <article className={`depth-lane depth-${lane.id}`} key={lane.id}><header><p>{lane.eyebrow}</p><h3>{lane.title}</h3><span>{lane.description}</span><small>{lane.videos.length} vídeo{lane.videos.length === 1 ? "" : "s"} nesta seleção</small></header>{lane.videos.length > 0 ? <div className="depth-video-grid">{lane.videos.map((video) => <DepthVideoCard key={`${lane.id}-${video.id}`} video={video} onPlay={setPlaying} />)}</div> : <div className="depth-empty">Ainda não há vídeos deste nível para o filtro atual.</div>}</article>)}</div>
        </section>}

        {ranked.length ? <section className="video-grid">
          {ranked.slice(0, Math.min(8, visibleCount)).map((video) => <VideoCard key={video.id} video={video} feedback={preferences.videoFeedback?.[video.youtubeId] ?? 0} onPlay={setPlaying} onFeedback={feedback} />)}
        </section> : <div className="empty-state"><strong>A Groq ainda não aprovou nenhum vídeo</strong><p>{pendingVideos.length > 0 ? "Os candidatos aparecem abaixo somente como fila de auditoria, não como recomendações." : "Tente outro filtro ou termo de busca."}</p></div>}

        {ranked.length > 8 && visibleCount > 8 && <section className="video-grid second-grid">
          {ranked.slice(8, visibleCount).map((video) => <VideoCard key={video.id} video={video} feedback={preferences.videoFeedback?.[video.youtubeId] ?? 0} onPlay={setPlaying} onFeedback={feedback} />)}
        </section>}

        {visibleCount < ranked.length && <button className="load-more" onClick={() => setVisibleCount((value) => Math.min(ranked.length, value + 12))}>Mostrar mais vídeos</button>}

        {pendingVideos.length > 0 && <section className="audit-queue" aria-labelledby="audit-queue-title">
          <div className="audit-queue-heading"><div><p className="eyebrow">PRÉ-SELEÇÃO — NÃO APROVADA</p><h2 id="audit-queue-title">Fila de auditoria da Groq</h2></div><p>Estes vídeos são apenas candidatos. Eles não fazem parte das recomendações enquanto a análise do conteúdo não os aprovar.</p></div>
          <div className="video-grid audit-queue-grid">{pendingVideos.map((video) => <VideoCard key={`pending-${video.id}`} video={video} feedback={preferences.videoFeedback?.[video.youtubeId] ?? 0} pending onPlay={setPlaying} onFeedback={feedback} />)}</div>
        </section>}

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

      {showInterestManager && <div className="overlay" onMouseDown={() => setShowInterestManager(false)}><section className="small-modal interest-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setShowInterestManager(false)}>×</button><p className="eyebrow">SEUS INTERESSES</p><h2>Personalizar temas</h2><div className="interest-list">{userInterests.map((item) => <div key={item}><span>{interestIcon(item)}</span><strong>{item}{!defaultInterestLabels.includes(item) && <small>{interestFeeds[item]?.videos?.length ? `${interestFeeds[item].videos.length} vídeos no campo` : "será preenchido ao abrir"}</small>}</strong><button onClick={() => persistInterests(userInterests.filter((interest) => interest !== item))} aria-label={`Remover ${item}`}>×</button></div>)}</div><form action={addInterest}><label>Novo assunto<input name="interest" required maxLength={30} placeholder="Ex.: arquitetura, direito, música" /></label><button type="submit">＋ Adicionar interesse</button></form><p className="modal-note">Novos campos são abertos e preenchidos automaticamente. Ao voltar depois de uma hora, o Clarity procura uma seleção renovada.</p></section></div>}


      {showAdd && <div className="overlay" onMouseDown={() => setShowAdd(false)}><section className="small-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setShowAdd(false)}>×</button><p className="eyebrow">MINHA BIBLIOTECA</p><h2>Adicionar vídeo</h2><form action={addVideo}><label>Link do YouTube<input name="url" type="url" required placeholder="https://youtube.com/watch?v=…" /></label><label>Título<input name="title" required placeholder="Título do vídeo" /></label><label>Tema<input name="topic" required placeholder="Ex.: economia" /></label>{addError && <p className="form-error">{addError}</p>}<button type="submit">Guardar e assistir aqui</button></form></section></div>}

      {activeArticle && <div className="overlay reading-overlay"><article className="reader" role="dialog" aria-modal="true">{reflectionVideos.length < 2 && <button className="reader-close" onClick={() => setActiveArticle(null)} aria-label="Fechar leitura">×</button>}<p className="eyebrow">{activeArticle.kicker}</p><h2>{activeArticle.title}</h2>{activeArticle.paragraphs.map((text) => <p key={text}>{text}</p>)}<blockquote>{activeArticle.principle}</blockquote><div className="reflection"><p className="eyebrow">SÍNTESE OBRIGATÓRIA</p><h3>Reconstrua o que aprendeu</h3><p>{summaryPrompt(languageLevel)} O roteiro combina explicação simples, fundamentos, conexão entre ideias, leitura crítica e aplicação.</p><div className="learning-methods"><span><b>Feynman</b> explique</span><span><b>Musk</b> encontre o tronco</span><span><b>Jobs</b> conecte e simplifique</span><span><b>Gates</b> questione evidências</span></div><label>1. Explicação simples<textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Sem jargões: qual é a ideia central e como ela funciona?" /></label><label>2. Tronco e galhos — princípios fundamentais<textarea value={principle} onChange={(event) => setPrinciple(event.target.value)} placeholder="Liste as verdades básicas das quais os detalhes dependem." /></label><label>3. Pontos conectados e foco<textarea value={connections} onChange={(event) => setConnections(event.target.value)} placeholder="Com que outra ideia isso se conecta? O que é essencial e o que pode ser cortado?" /></label><label>4. Evidências, dúvidas e contrapontos<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Que evidência sustenta a conclusão? O que ainda não está claro? O que mudaria sua opinião?" /></label><label>5. Aplicação ou experimento concreto<textarea value={application} onChange={(event) => setApplication(event.target.value)} placeholder="O que você fará, testará ou explicará nas próximas 24 horas?" /></label><button disabled={summary.trim().length < 50 || principle.trim().length < 30 || connections.trim().length < 30 || evidence.trim().length < 30 || application.trim().length < 20} onClick={saveReflection}>Salvar resumo em Markdown e continuar</button></div></article></div>}
    </div>
  );
}
