"use client";

import { useEffect, useMemo, useState } from "react";
import { readingTypes, readings, type Reading, type ReadingLevel } from "../../lib/readings";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const categories = ["Todos", "Negócios", "Ideias", "Mundo", "Política", "Fé", "Ciência", "Criação"];
const levels: Array<"Todos" | ReadingLevel> = ["Todos", "Essencial", "Intermediário", "Avançado"];

export default function ReadingsPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [type, setType] = useState("Todos");
  const [level, setLevel] = useState("Todos");
  const [active, setActive] = useState<Reading | null>(null);
  const [simple, setSimple] = useState("");
  const [principles, setPrinciples] = useState("");
  const [connections, setConnections] = useState("");
  const [evidence, setEvidence] = useState("");
  const [application, setApplication] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("clarity-theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("clarity-theme", theme); } catch {}
  }, [theme]);

  const filtered = useMemo(() => readings.filter((reading) => {
    const text = `${reading.title} ${reading.author} ${reading.source} ${reading.description} ${reading.category}`.toLowerCase();
    return text.includes(query.trim().toLowerCase())
      && (category === "Todos" || reading.category === category)
      && (type === "Todos" || reading.type === type)
      && (level === "Todos" || reading.level === level);
  }), [query, category, type, level]);

  function selectReading(reading: Reading) {
    setActive(reading);
    setSimple(""); setPrinciples(""); setConnections(""); setEvidence(""); setApplication("");
  }

  function saveReadingSummary() {
    if (!active) return;
    const date = new Date();
    const entry = { date: date.toISOString(), readingId: active.id, title: active.title, author: active.author, source: active.source, simple, principles, connections, evidence, application };
    try {
      const previous = JSON.parse(localStorage.getItem("clarity-reading-journal") || "[]");
      localStorage.setItem("clarity-reading-journal", JSON.stringify([...previous, entry]));
    } catch {}
    const markdown = `# Resumo de leitura — ${active.title}\n\n- **Autor:** ${active.author}\n- **Fonte:** ${active.source}\n- **Data:** ${date.toLocaleDateString("pt-BR")}\n- **Link:** ${active.url}\n\n## 1. Explicação simples — método Feynman\n${simple}\n\n## 2. Tronco e galhos — primeiros princípios\n${principles}\n\n## 3. Pontos conectados e foco\n${connections}\n\n## 4. Evidências, dúvidas e contrapontos\n${evidence}\n\n## 5. Aplicação e teste\n${application}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `clarity-leitura-${active.id}-${date.toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setActive(null);
  }

  const valid = simple.trim().length >= 50 && principles.trim().length >= 30 && connections.trim().length >= 30 && evidence.trim().length >= 30 && application.trim().length >= 20;

  return (
    <div className="library-page">
      <header className="library-topbar">
        <a className="brand" href={`${BASE_PATH}/`}><span className="brand-mark">C</span><strong>Clarity</strong><sup>LEITURAS</sup></a>
        <div className="search-box"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar título, autor, fonte ou tema" aria-label="Pesquisar leituras" /><button aria-label="Pesquisar">⌕</button></div>
        <div className="header-actions"><a className="back-link" href={`${BASE_PATH}/estudo/`}>⌘ Estudo</a><a className="back-link" href={`${BASE_PATH}/`}>← Vídeos</a><button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema">{theme === "dark" ? "☀" : "◐"}</button></div>
      </header>

      <main className="library-content">
        <section className="library-hero">
          <div><p className="eyebrow">BIBLIOTECA CLARITY</p><h1>Leia para construir uma visão de mundo</h1><p>Fontes abertas e confiáveis para sair da superfície: livros, artigos, pesquisas, documentos e guias. Abra a fonte, volte e ensine a ideia com suas palavras.</p></div>
          <div className="library-stat"><strong>{readings.length}</strong><span>leituras selecionadas</span><small>Sem feed infinito</small></div>
        </section>

        <section className="reading-method">
          <p className="eyebrow">MÉTODO DE SÍNTESE</p>
          <div><span><b>1</b><strong>Explique</strong><small>Feynman: encontre as lacunas.</small></span><span><b>2</b><strong>Estruture</strong><small>Tronco antes das folhas.</small></span><span><b>3</b><strong>Conecte</strong><small>Una pontos e elimine ruído.</small></span><span><b>4</b><strong>Questione</strong><small>Procure evidências e limites.</small></span><span><b>5</b><strong>Aplique</strong><small>Transforme ideia em teste.</small></span></div>
        </section>

        <section className="library-filters" aria-label="Filtros de leitura">
          <div><label>Tema</label><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label>Formato</label><select value={type} onChange={(event) => setType(event.target.value)}>{readingTypes.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label>Complexidade</label><select value={level} onChange={(event) => setLevel(event.target.value)}>{levels.map((item) => <option key={item}>{item}</option>)}</select></div>
          <span>{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</span>
        </section>

        {filtered.length > 0 ? <section className="library-grid">{filtered.map((reading) => <article className="library-reading-card" key={reading.id}>
          <div className="library-card-top"><span className="reading-type">{reading.type}</span><span>{reading.category}</span><span>{reading.level}</span></div>
          <h2>{reading.title}</h2><p>{reading.description}</p><small>{reading.author} · {reading.source}</small>
          <blockquote><b>Pergunta de leitura</b>{reading.question}</blockquote>
          <div className="library-card-actions"><a href={reading.url} target="_blank" rel="noreferrer">Abrir fonte ↗</a><button onClick={() => selectReading(reading)}>Resumir leitura</button></div>
          <footer><span>{reading.language}</span><span>{reading.readTime}</span></footer>
        </article>)}</section> : <div className="empty-state"><strong>Nenhuma leitura encontrada</strong><p>Remova um filtro ou pesquise outro termo.</p></div>}
      </main>

      {active && <div className="overlay reading-overlay"><section className="reader summary-workshop" role="dialog" aria-modal="true" aria-label={`Resumir ${active.title}`}>
        <button className="reader-close" onClick={() => setActive(null)} aria-label="Fechar resumo">×</button><p className="eyebrow">OFICINA DE SÍNTESE · {active.type}</p><h2>{active.title}</h2><p className="summary-source">{active.author} · {active.source}</p><a className="source-link" href={active.url} target="_blank" rel="noreferrer">Abrir a fonte antes de resumir ↗</a>
        <div className="reflection"><h3>Escreva para descobrir se entendeu</h3><p>O arquivo final fica pronto para guardar na pasta do diário e consultar em futuras aulas com o Codex.</p><label>1. Explique em linguagem simples<textarea value={simple} onChange={(event) => setSimple(event.target.value)} placeholder="O que o texto defende e como a ideia funciona?" /></label><label>2. Quais são o tronco e os princípios fundamentais?<textarea value={principles} onChange={(event) => setPrinciples(event.target.value)} placeholder="Sem quais conceitos o restante não se sustenta?" /></label><label>3. Que pontos você conectou? O que é essencial?<textarea value={connections} onChange={(event) => setConnections(event.target.value)} placeholder="Relacione com outra área, experiência ou leitura." /></label><label>4. Quais evidências, dúvidas e contrapontos restaram?<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Diferencie fatos, inferências e opiniões." /></label><label>5. Qual aplicação ou teste vem agora?<textarea value={application} onChange={(event) => setApplication(event.target.value)} placeholder="Defina uma ação observável." /></label><button disabled={!valid} onClick={saveReadingSummary}>Baixar resumo em Markdown</button><small className="completion-hint">Todos os cinco campos precisam de uma resposta desenvolvida.</small></div>
      </section></div>}
    </div>
  );
}
