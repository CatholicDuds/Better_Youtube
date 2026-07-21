"use client";

import { useEffect, useMemo, useState } from "react";
import { seedVideos, type Video } from "../lib/videos";
import {
  DEFAULT_PREFERENCES,
  rankVideos,
  type Preferences,
  type RankedVideo,
} from "../lib/recommender";

type Intent = "negocios" | "ideias" | "mundo" | "fe" | "curiosidade" | "criar";

type Article = { title: string; kicker: string; readTime: string; paragraphs: string[]; takeaway: string; principles: [string, string, string] };

const intentCopy: Record<Intent, { label: string; prompt: string }> = {
  negocios: { label: "Negócios", prompt: "Economia, estratégia e gestão" },
  ideias: { label: "Ideias", prompt: "Filosofia e natureza humana" },
  mundo: { label: "Mundo", prompt: "Política, história e geopolítica" },
  fe: { label: "Fé & razão", prompt: "Formação católica e vida interior" },
  curiosidade: { label: "Curiosidade", prompt: "Astronomia, foguetes e grandes perguntas" },
  criar: { label: "Criar", prompt: "Canais, roteiros e planejamento" },
};

const intentTopics: Record<Intent, string[]> = {
  negocios: ["negócios", "economia", "gestão", "administração"],
  ideias: ["filosofia", "natureza humana", "psicologia", "antropologia"],
  mundo: ["geopolítica", "política", "história", "economia"],
  fe: ["formação católica", "teologia", "vida espiritual", "filosofia"],
  curiosidade: ["astronomia", "foguetes", "curiosidades", "ciência"],
  criar: ["criação de vídeos", "roteiro", "estratégia de canal", "planejamento"],
};

const articles: Article[] = [
  {
    kicker: "ESTRATÉGIA · 4 MIN",
    title: "Pensar em segunda ordem muda a qualidade de uma decisão",
    readTime: "4 min de leitura",
    paragraphs: [
      "Uma decisão fácil olha apenas para o primeiro efeito: reduzir o preço aumenta as vendas; publicar mais aumenta o alcance; contratar mais acelera a entrega. O pensamento de segunda ordem pergunta o que acontece depois — e depois disso.",
      "Se o preço menor atrai clientes menos fiéis, a receita pode subir enquanto a empresa enfraquece. Se publicar todos os dias reduz a qualidade, o canal cresce em volume e perde confiança. Bons estrategistas não tentam prever tudo: eles desenham uma pequena árvore de consequências e procuram efeitos que se acumulam.",
      "Antes de decidir, escreva três linhas: o efeito imediato, o provável efeito em seis meses e o comportamento que essa escolha recompensa. Essa pausa simples costuma revelar custos que uma planilha não mostra.",
    ],
    takeaway: "Pergunta para guardar: se eu repetir esta decisão cem vezes, em quem ou no que ela me transforma?",
    principles: ["Básico — toda escolha produz mais de um efeito.", "Intermediário — efeitos acumulados importam mais do que vitórias imediatas.", "Avançado — estratégias robustas moldam incentivos e permanecem boas quando repetidas."],
  },
  {
    kicker: "CRIAÇÃO · 5 MIN",
    title: "Um bom vídeo começa com uma tensão, não com uma introdução",
    readTime: "5 min de leitura",
    paragraphs: [
      "Roteiros fracos começam explicando o tema. Roteiros fortes começam mostrando por que o tema é um problema. A tensão pode ser uma contradição, uma pergunta sem resposta, uma escolha difícil ou um fato que desafia a intuição.",
      "Estruture o vídeo em quatro movimentos: promessa, contexto, descoberta e consequência. A promessa diz o que o espectador compreenderá. O contexto entrega apenas o necessário. A descoberta reorganiza o que ele pensava. A consequência responde: o que muda agora que sabemos disso?",
      "Planeje uma ideia central por vídeo e corte tudo o que não a serve. Um canal ganha identidade quando cada publicação parece parte da mesma investigação, não quando repete a mesma estética.",
    ],
    takeaway: "Exercício: resuma seu próximo vídeo em ‘Você pensa X, mas Y — e isso importa porque Z’. Se não couber, a ideia ainda não está clara.",
    principles: ["Básico — um vídeo precisa defender uma ideia central.", "Intermediário — tensão e consequência sustentam uma narrativa.", "Avançado — a tese editorial conecta vídeos isolados em um canal coerente."],
  },
  {
    kicker: "CURIOSIDADE · 4 MIN",
    title: "A escala do espaço é também uma aula de humildade",
    readTime: "4 min de leitura",
    paragraphs: [
      "A luz do Sol leva pouco mais de oito minutos para chegar à Terra. Da estrela mais próxima depois dele, leva mais de quatro anos. Quando olhamos o céu, nunca vemos o universo ‘agora’; vemos uma coleção de passados chegando em momentos diferentes.",
      "Foguetes não sobem apenas vencendo a gravidade. Eles precisam ganhar velocidade horizontal suficiente para continuar caindo sem tocar o chão: é isso que chamamos de órbita. A imagem ajuda a corrigir uma intuição comum — ir ao espaço não é apenas subir, mas aprender a cair ao redor de um mundo.",
      "A boa curiosidade não coleciona fatos isolados. Ela usa um fato para substituir uma imagem mental ruim por uma melhor. O ganho real não é saber mais uma coisa, mas passar a fazer perguntas melhores.",
    ],
    takeaway: "Ideia para observar: toda explicação científica valiosa muda uma imagem que carregávamos sem perceber.",
    principles: ["Básico — fatos ganham sentido quando corrigem uma intuição.", "Intermediário — modelos mentais explicam mais do que listas de curiosidades.", "Avançado — conhecer é trocar uma representação menos precisa por outra que prevê melhor."],
  },
];

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function VideoCard({
  video,
  onFeedback,
  onWatch,
}: {
  video: RankedVideo;
  onFeedback: (id: string, value: 1 | -1) => void;
  onWatch: (video: RankedVideo) => void;
}) {
  return (
    <article className="video-card">
      <a
        className={`video-visual visual-${video.palette}`}
        href={video.url}
        target="_blank"
        rel="noreferrer"
        onClick={() => onWatch(video)}
        aria-label={`Assistir ${video.title} no YouTube`}
      >
        <span className="visual-topic">{video.topic}</span>
        <span className="visual-mark" aria-hidden="true">
          {video.mark}
        </span>
        <span className="duration">{durationLabel(video.durationSeconds)}</span>
        <span className="play" aria-hidden="true">▶</span>
      </a>
      <div className="video-body">
        <div className="video-heading">
          <div className="channel-avatar" aria-hidden="true">
            {video.channel.slice(0, 1)}
          </div>
          <div>
            <a href={video.url} target="_blank" rel="noreferrer" className="video-title" onClick={() => onWatch(video)}>
              {video.title}
            </a>
            <p className="channel-line">{video.channel} · {video.publishedLabel}</p>
          </div>
        </div>
        <p className="why"><span>Por que aqui</span> {video.explanation}</p>
        <div className="card-actions">
          <button onClick={() => onFeedback(video.id, 1)} aria-label="Quero mais vídeos assim">＋ mais assim</button>
          <button onClick={() => onFeedback(video.id, -1)} aria-label="Quero menos vídeos assim">− menos assim</button>
          <span className="score" title="Pontuação calculada no seu dispositivo">{Math.round(video.score)} pts</span>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [intent, setIntent] = useState<Intent>("ideias");
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [showControls, setShowControls] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [customVideos, setCustomVideos] = useState<Video[]>([]);
  const [saved, setSaved] = useState(false);
  const [videosSinceRead, setVideosSinceRead] = useState(0);
  const [readingIndex, setReadingIndex] = useState(0);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [readingConfirmed, setReadingConfirmed] = useState(false);
  const [watchedBlock, setWatchedBlock] = useState<string[]>([]);
  const [reflectionVideos, setReflectionVideos] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [principle, setPrinciple] = useState("");
  const [application, setApplication] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("clarity-preferences");
      const videos = localStorage.getItem("clarity-videos");
      if (raw) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(raw) });
      if (videos) setCustomVideos(JSON.parse(videos));
    } catch {
      // A private browsing session can make storage unavailable; the app still works.
    }
  }, []);

  const videos = useMemo(() => [...customVideos, ...seedVideos], [customVideos]);
  const ranked = useMemo(() => {
    const tuned: Preferences = {
      ...preferences,
      topics: intentTopics[intent],
      discovery: intent === "mundo" ? Math.max(preferences.discovery, 68) : preferences.discovery,
      depth: intent === "ideias" || intent === "fe" ? Math.max(preferences.depth, 85) : preferences.depth,
    };
    return rankVideos(videos, tuned).filter((video) => {
      const haystack = `${video.title} ${video.channel} ${video.topic}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [intent, preferences, query, videos]);

  function persist(next: Preferences) {
    setPreferences(next);
    try {
      localStorage.setItem("clarity-preferences", JSON.stringify(next));
    } catch {}
  }

  function feedback(id: string, value: 1 | -1) {
    const video = videos.find((item) => item.id === id);
    if (!video) return;
    const topicWeights = { ...preferences.topicWeights };
    topicWeights[video.topic] = Math.max(-3, Math.min(3, (topicWeights[video.topic] ?? 0) + value));
    persist({ ...preferences, topicWeights });
  }

  function addVideo(formData: FormData) {
    const url = String(formData.get("url") || "");
    const title = String(formData.get("title") || "Vídeo salvo para depois");
    const topic = String(formData.get("topic") || "tecnologia").toLowerCase();
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (!match) return;
    const next: Video = {
      id: `custom-${match[1]}`,
      youtubeId: match[1],
      title,
      channel: "Sua biblioteca",
      topic,
      url,
      durationSeconds: 900,
      depth: 0.72,
      novelty: 0.55,
      quality: 0.8,
      evergreen: 0.9,
      publishedLabel: "adicionado agora",
      palette: "sand",
      mark: "SALVO",
    };
    const nextVideos = [next, ...customVideos.filter((item) => item.id !== next.id)];
    setCustomVideos(nextVideos);
    localStorage.setItem("clarity-videos", JSON.stringify(nextVideos));
    setShowAdd(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function registerWatch(video: RankedVideo) {
    const next = videosSinceRead + 1;
    const nextBlock = [...watchedBlock, video.title];
    if (next >= 2) {
      setVideosSinceRead(0);
      setReflectionVideos(nextBlock);
      setWatchedBlock([]);
      setActiveArticle(articles[readingIndex % articles.length]);
      setReadingIndex((index) => index + 1);
      setReadingConfirmed(false);
    } else {
      setVideosSinceRead(next);
      setWatchedBlock(nextBlock);
    }
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
    const markdown = `# Diário de aprendizado — ${today}\n\n${daily.map((item: typeof entry, index: number) => `## Bloco ${index + 1}\n\n### Vídeos\n${item.videos.map((title: string) => `- ${title}`).join("\n")}\n\n### Leitura\n- ${item.article}\n\n### Resumo com minhas palavras\n${item.summary}\n\n### Princípio fundamental\n${item.principle}\n\n### Aplicação concreta\n${item.application}\n`).join("\n---\n\n")}\n\n## Perguntas para a próxima aula\n- O que ainda não consigo explicar com clareza?\n- Qual premissa eu deveria testar?\n- Como este princípio se conecta ao que já estudei?\n`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clarity-diario-${today}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setActiveArticle(null);
    setSummary("");
    setPrinciple("");
    setApplication("");
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Clarity, início">
          <span className="brand-icon">C</span>
          <span>CLARITY</span>
        </a>
        <div className="search-wrap">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar na sua biblioteca" aria-label="Buscar vídeos" />
          <kbd>/</kbd>
        </div>
        <div className="top-actions">
          <button className="text-button" onClick={() => setShowAdd(true)}>＋ Adicionar vídeo</button>
          <button className="avatar" aria-label="Perfil local">EG</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span></span> Sua atenção tem destino</div>
        <h1>O que vale<br /><em>compreender?</em></h1>
        <p>Aulas, ensaios e conversas longas para formar repertório — não para preencher silêncio.</p>
        <div className="topic-rail" aria-label="Temas da biblioteca">
          <span>Negócios</span><span>Economia</span><span>Filosofia</span><span>Natureza humana</span><span>Geopolítica</span><span>Gestão</span><span>Formação católica</span><span>Astronomia</span><span>Foguetes</span><span>Criação de vídeos</span>
        </div>
        <div className="intent-grid" role="group" aria-label="Escolha sua intenção">
          {(Object.keys(intentCopy) as Intent[]).map((key, index) => (
            <button key={key} className={intent === key ? "intent active" : "intent"} onClick={() => { setIntent(key); setVisibleCount(6); }}>
              <span className="intent-number">0{index + 1}</span>
              <span><strong>{intentCopy[key].label}</strong><small>{intentCopy[key].prompt}</small></span>
              <span className="intent-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="feed-section">
        <div className="section-head">
          <div>
            <p className="section-kicker">AULAS E ENSAIOS · {ranked.length} CONTEÚDOS</p>
            <h2>Para {intentCopy[intent].label.toLowerCase()}</h2>
          </div>
          <button className="tune-button" onClick={() => setShowControls((value) => !value)} aria-expanded={showControls}>
            <span>⚙</span> Ajustar algoritmo
          </button>
        </div>

        {showControls && (
          <aside className="algorithm-panel">
            <div className="panel-copy">
              <p className="section-kicker">SEU ALGORITMO</p>
              <h3>Você define o que ganha espaço.</h3>
              <p>O motor favorece profundidade, valor atemporal e diversidade de perspectivas. Todos os cálculos acontecem neste dispositivo.</p>
              <button onClick={() => persist(DEFAULT_PREFERENCES)}>Restaurar equilíbrio</button>
            </div>
            <div className="sliders">
              <label>Profundidade <output>{preferences.depth}%</output><input type="range" min="0" max="100" value={preferences.depth} onChange={(e) => persist({ ...preferences, depth: Number(e.target.value) })} /></label>
              <label>Descoberta <output>{preferences.discovery}%</output><input type="range" min="0" max="100" value={preferences.discovery} onChange={(e) => persist({ ...preferences, discovery: Number(e.target.value) })} /></label>
              <label>Duração máxima <output>{preferences.maxMinutes} min</output><input type="range" min="8" max="90" step="2" value={preferences.maxMinutes} onChange={(e) => persist({ ...preferences, maxMinutes: Number(e.target.value) })} /></label>
              <label>Valor formativo <output>{preferences.evergreen}%</output><input type="range" min="0" max="100" value={preferences.evergreen} onChange={(e) => persist({ ...preferences, evergreen: Number(e.target.value) })} /></label>
            </div>
          </aside>
        )}

        {ranked.length ? (
          <div className="video-grid">
            {ranked.slice(0, visibleCount).map((video) => <VideoCard key={video.id} video={video} onFeedback={feedback} onWatch={registerWatch} />)}
          </div>
        ) : (
          <div className="empty-state"><span>⌕</span><h3>Nada encontrado.</h3><p>Tente outro tema ou limpe a busca.</p></div>
        )}

        {visibleCount < ranked.length ? (
          <button className="more-button" onClick={() => setVisibleCount((count) => count + 3)}>Mostrar mais 3 vídeos</button>
        ) : ranked.length > 0 ? (
          <div className="feed-end"><span>✓</span><strong>Você chegou ao fim.</strong><p>Volte quando tiver uma nova intenção — não há rolagem infinita aqui.</p></div>
        ) : null}
      </section>

      <section className="reading-section">
        <div className="reading-intro">
          <p className="section-kicker">LER TAMBÉM É PARTE DO MÉTODO</p>
          <h2>Entre uma ideia<br />e a próxima.</h2>
          <p>A cada dois vídeos, o Clarity propõe uma leitura curta. É a pausa que transforma informação em repertório.</p>
        </div>
        <div className="article-list">
          {articles.map((article, index) => (
            <button key={article.title} className="article-card" onClick={() => { setActiveArticle(article); setReadingConfirmed(false); }}>
              <span className="article-index">0{index + 1}</span>
              <span><small>{article.kicker}</small><strong>{article.title}</strong><em>{article.readTime} →</em></span>
            </button>
          ))}
        </div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-icon">C</span><span>CLARITY</span></div>
        <p>Uma interface experimental para assistir com intenção.<br />Sem anúncios. Sem autoplay. Seus dados ficam com você.</p>
        <a href="https://github.com" target="_blank" rel="noreferrer">Código aberto ↗</a>
      </footer>

      {showAdd && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowAdd(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdd(false)} aria-label="Fechar">×</button>
            <p className="section-kicker">SUA BIBLIOTECA</p>
            <h2 id="add-title">Adicionar um vídeo</h2>
            <p>Cole um link do YouTube. Ele ficará salvo apenas neste navegador.</p>
            <form action={addVideo}>
              <label>Link do YouTube<input name="url" type="url" required placeholder="https://youtube.com/watch?v=…" /></label>
              <label>Título<input name="title" required placeholder="O que vale lembrar sobre este vídeo?" /></label>
              <label>Tema<select name="topic"><option>Negócios</option><option>Economia</option><option>Gestão</option><option>Filosofia</option><option>Natureza humana</option><option>Geopolítica</option><option>Política</option><option>Formação católica</option><option>Teologia</option><option>História</option></select></label>
              <button className="submit-button" type="submit">Guardar na biblioteca</button>
            </form>
          </div>
        </div>
      )}
      {activeArticle && (
        <div className="modal-backdrop reading-backdrop">
          <article className="reader" role="dialog" aria-modal="true" aria-labelledby="reader-title">
            <div className="reader-progress"><span></span><span></span><span></span></div>
            <p className="section-kicker">PAUSA DE LEITURA · APÓS 2 VÍDEOS</p>
            <h2 id="reader-title">{activeArticle.title}</h2>
            <div className="reader-body">{activeArticle.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            <blockquote>{activeArticle.takeaway}</blockquote>
            <div className="principle-ladder">
              <p className="section-kicker">DO FUNDAMENTO AO AVANÇADO</p>
              {activeArticle.principles.map((item, index) => <p key={item}><span>0{index + 1}</span>{item}</p>)}
            </div>
            <div className="reflection-form">
              <p className="section-kicker">AGORA ENSINE DE VOLTA</p>
              <p>Resuma os dois vídeos e esta leitura como se explicasse a alguém. O arquivo diário será baixado para você guardar em <strong>diario-de-aprendizado/entradas</strong> e consultar com o Codex.</p>
              <label>1. O que foi dito, com suas palavras?<textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Sem copiar: reconstrua a ideia…" /></label>
              <label>2. Qual princípio fundamental conecta as ideias?<textarea value={principle} onChange={(event) => setPrinciple(event.target.value)} placeholder="Vá além do exemplo e encontre a regra…" /></label>
              <label>3. Onde você aplicará isso?<textarea value={application} onChange={(event) => setApplication(event.target.value)} placeholder="Defina uma decisão ou experiência concreta…" /></label>
            </div>
            <label className="reading-check"><input type="checkbox" checked={readingConfirmed} onChange={(event) => setReadingConfirmed(event.target.checked)} /> Consigo explicar a ideia sem reler o texto.</label>
            <button className="submit-button" disabled={!readingConfirmed || summary.trim().length < 30 || principle.trim().length < 20 || application.trim().length < 20} onClick={saveReflection}>Salvar diário e voltar ao feed</button>
          </article>
        </div>
      )}
      {saved && <div className="toast">✓ Vídeo salvo no seu dispositivo</div>}
    </main>
  );
}
