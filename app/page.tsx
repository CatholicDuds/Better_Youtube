"use client";

import { useEffect, useMemo, useState } from "react";
import { seedVideos, type Video } from "../lib/videos";
import { DEFAULT_PREFERENCES, rankVideos, type Preferences, type RankedVideo } from "../lib/recommender";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const categories = ["Todos", "Negócios", "Ideias", "Mundo", "Fé", "Ciência", "Criação", "Minha biblioteca"];
const palettes = ["blue", "coral", "ink", "moss", "violet", "sand"] as const;

type Article = {
  title: string;
  kicker: string;
  paragraphs: string[];
  principle: string;
};

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

function thumbnail(video: Video) {
  const id = video.thumbnailId || (video.embedType !== "playlist" ? video.youtubeId : "");
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function embedUrl(video: Video) {
  return video.embedType === "playlist"
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${video.youtubeId}&rel=0`
    : `https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`;
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
          <p>{video.topic} · {video.publishedLabel}</p>
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
  const [query, setQuery] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [liveVideos, setLiveVideos] = useState<Video[]>([]);
  const [customVideos, setCustomVideos] = useState<Video[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [playing, setPlaying] = useState<RankedVideo | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [watchedBlock, setWatchedBlock] = useState<string[]>([]);
  const [articleIndex, setArticleIndex] = useState(0);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [reflectionVideos, setReflectionVideos] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [principle, setPrinciple] = useState("");
  const [application, setApplication] = useState("");

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("clarity-theme") as "dark" | "light" | null;
      const storedPrefs = localStorage.getItem("clarity-preferences");
      const storedVideos = localStorage.getItem("clarity-videos");
      if (storedTheme) setTheme(storedTheme);
      if (storedPrefs) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) });
      if (storedVideos) setCustomVideos(JSON.parse(storedVideos));
    } catch {}

    fetch(`${BASE_PATH}/data/latest-videos.json`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (Array.isArray(data.videos)) setLiveVideos(data.videos);
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("clarity-theme", theme); } catch {}
  }, [theme]);

  const videos = useMemo(() => {
    const all = [...customVideos, ...liveVideos, ...seedVideos];
    return all.filter((video, index) => all.findIndex((item) => item.youtubeId === video.youtubeId) === index);
  }, [customVideos, liveVideos]);

  const ranked = useMemo(() => {
    return rankVideos(videos, preferences).filter((video) => {
      const categoryMatch = category === "Todos" || video.category === category;
      const text = `${video.title} ${video.channel} ${video.topic} ${video.category}`.toLowerCase();
      return categoryMatch && text.includes(query.trim().toLowerCase());
    });
  }, [videos, preferences, category, query]);

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
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{6,})/);
    if (!match) return;
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
    setCategory("Minha biblioteca");
  }

  function saveReflection() {
    if (!activeArticle) return;
    const date = new Date();
    const entry = { date: date.toISOString(), videos: reflectionVideos, article: activeArticle.title, summary, principle, application };
    let entries = [entry];
    try {
      const previous = JSON.parse(localStorage.getItem("clarity-journal") || "[]");
      entries = [...previous, entry];
      localStorage.setItem("clarity-journal", JSON.stringify(entries));
    } catch {}
    const today = date.toISOString().slice(0, 10);
    const daily = entries.filter((item: typeof entry) => item.date.slice(0, 10) === today);
    const markdown = `# Diário de aprendizado — ${today}\n\n${daily.map((item: typeof entry, index: number) => `## Bloco ${index + 1}\n\n### Vídeos\n${item.videos.map((title: string) => `- ${title}`).join("\n")}\n\n### Leitura\n- ${item.article}\n\n### Resumo\n${item.summary}\n\n### Princípio\n${item.principle}\n\n### Aplicação\n${item.application}`).join("\n\n---\n\n")}`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `clarity-diario-${today}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setActiveArticle(null);
    setSummary(""); setPrinciple(""); setApplication("");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-group">
          <button className="icon-button menu-button" aria-label="Abrir menu">☰</button>
          <a className="brand" href="#top"><span className="brand-mark">C</span><strong>Clarity</strong><sup>BR</sup></a>
        </div>
        <div className="search-box">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar aulas, canais e temas" aria-label="Pesquisar vídeos" />
          <button aria-label="Pesquisar">⌕</button>
        </div>
        <div className="header-actions">
          <button className="create-button" onClick={() => setShowAdd(true)}>＋ Criar</button>
          <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema">{theme === "dark" ? "☀" : "◐"}</button>
          <span className="avatar">EG</span>
        </div>
      </header>

      <aside className="sidebar">
        <nav>
          <button className={category === "Todos" ? "nav-item active" : "nav-item"} onClick={() => setCategory("Todos")}><span>⌂</span>Início</button>
          <button className="nav-item" onClick={() => document.getElementById("leituras")?.scrollIntoView()}><span>▤</span>Leituras</button>
          <button className="nav-item" onClick={() => setCategory("Minha biblioteca")}><span>▱</span>Minha biblioteca</button>
        </nav>
        <div className="side-separator" />
        <p className="side-label">EXPLORAR</p>
        {categories.slice(1, -1).map((item) => <button key={item} className={category === item ? "nav-item active" : "nav-item"} onClick={() => { setCategory(item); setVisibleCount(12); }}><span>{item === "Fé" ? "✦" : "○"}</span>{item}</button>)}
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
            <button className="tune-button" onClick={() => setShowControls(!showControls)}>⚙ Ajustar algoritmo</button>
          </div>
        </section>

        {showControls && <section className="algorithm-panel">
          <div><strong>Seu algoritmo</strong><p>Nenhum clique oculto decide por você. Ajuste os critérios conscientemente.</p></div>
          <label>Profundidade <output>{preferences.depth}%</output><input type="range" min="0" max="100" value={preferences.depth} onChange={(event) => persistPreferences({ ...preferences, depth: Number(event.target.value) })} /></label>
          <label>Descoberta <output>{preferences.discovery}%</output><input type="range" min="0" max="100" value={preferences.discovery} onChange={(event) => persistPreferences({ ...preferences, discovery: Number(event.target.value) })} /></label>
          <label>Duração máxima <output>{preferences.maxMinutes} min</output><input type="range" min="8" max="120" value={preferences.maxMinutes} onChange={(event) => persistPreferences({ ...preferences, maxMinutes: Number(event.target.value) })} /></label>
        </section>}

        {ranked.length ? <section className="video-grid">
          {ranked.slice(0, visibleCount).map((video) => <VideoCard key={video.id} video={video} onPlay={setPlaying} onFeedback={feedback} />)}
        </section> : <div className="empty-state"><strong>Nenhum vídeo encontrado</strong><p>Tente outro filtro ou termo de busca.</p></div>}

        {visibleCount < ranked.length && <button className="load-more" onClick={() => setVisibleCount((value) => value + 8)}>Mostrar mais vídeos</button>}

        <section className="reading-section" id="leituras">
          <div><p className="eyebrow">PAUSA PARA PENSAR</p><h2>Leitura entre os vídeos</h2><p>Informação vira conhecimento quando você consegue reconstruí-la com suas palavras.</p></div>
          <div className="article-grid">{articles.map((article, index) => <button key={article.title} onClick={() => { setReflectionVideos([]); setActiveArticle(article); }}><span>0{index + 1}</span><small>{article.kicker}</small><strong>{article.title}</strong><em>Ler artigo →</em></button>)}</div>
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

      {showAdd && <div className="overlay" onMouseDown={() => setShowAdd(false)}><section className="small-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setShowAdd(false)}>×</button><p className="eyebrow">MINHA BIBLIOTECA</p><h2>Adicionar vídeo</h2><form action={addVideo}><label>Link do YouTube<input name="url" type="url" required placeholder="https://youtube.com/watch?v=…" /></label><label>Título<input name="title" required placeholder="Título do vídeo" /></label><label>Tema<input name="topic" required placeholder="Ex.: economia" /></label><button type="submit">Guardar e assistir aqui</button></form></section></div>}

      {activeArticle && <div className="overlay reading-overlay"><article className="reader" role="dialog" aria-modal="true"><p className="eyebrow">{activeArticle.kicker}</p><h2>{activeArticle.title}</h2>{activeArticle.paragraphs.map((text) => <p key={text}>{text}</p>)}<blockquote>{activeArticle.principle}</blockquote><div className="reflection"><h3>Ensine de volta</h3><p>Resuma os vídeos e a leitura. Extraia o princípio antes de avançar.</p><label>Resumo<textarea value={summary} onChange={(event) => setSummary(event.target.value)} /></label><label>Princípio fundamental<textarea value={principle} onChange={(event) => setPrinciple(event.target.value)} /></label><label>Aplicação concreta<textarea value={application} onChange={(event) => setApplication(event.target.value)} /></label><button disabled={summary.trim().length < 30 || principle.trim().length < 20 || application.trim().length < 20} onClick={saveReflection}>Salvar diário e continuar</button></div></article></div>}
    </div>
  );
}
