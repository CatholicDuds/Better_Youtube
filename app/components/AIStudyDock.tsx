"use client";

import { useState } from "react";

const providers = [
  { name: "ChatGPT", mark: "C", url: "https://chatgpt.com/", color: "#10a37f" },
  { name: "Claude", mark: "A", url: "https://claude.ai/new", color: "#d97757" },
  { name: "Gemini", mark: "G", url: "https://gemini.google.com/", color: "#6e8df6" },
  { name: "Grok", mark: "X", url: "https://grok.com/", color: "#727272" },
];

function latestLearningContext() {
  try {
    const entries = [
      ...JSON.parse(localStorage.getItem("clarity-journal") || "[]"),
      ...JSON.parse(localStorage.getItem("clarity-reading-journal") || "[]"),
    ].sort((a, b) => Date.parse(b.date || "") - Date.parse(a.date || ""));
    if (entries[0]) return JSON.stringify(entries[0], null, 2);
  } catch {}
  const selection = window.getSelection()?.toString().trim();
  return selection ? selection.slice(0, 5000) : "Ainda não há um resumo salvo. Comece perguntando qual assunto quero dominar e o que já sei sobre ele.";
}

function studyPrompt() {
  return `Atue como meu professor socrático e coach de aprendizagem por princípios.

Objetivo:
- Diagnostique primeiro o que eu realmente entendi.
- Peça uma explicação simples, no espírito do método Feynman.
- Separe o tronco e os princípios fundamentais dos detalhes.
- Ajude-me a conectar pontos entre áreas e eliminar o que é supérfluo.
- Diferencie fatos, inferências, opiniões, evidências e dúvidas.
- Apresente um contraponto forte e um caso em que a ideia falha.
- Faça apenas uma pergunta por vez e avance do básico ao avançado.
- Termine com uma aplicação ou experimento observável.

Meu contexto mais recente no Clarity:
${latestLearningContext()}`;
}

export default function AIStudyDock({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  function launch(provider: typeof providers[number]) {
    window.open(provider.url, "_blank", "noopener,noreferrer");
    navigator.clipboard.writeText(studyPrompt())
      .then(() => setStatus(`Roteiro copiado. Cole no ${provider.name}.`))
      .catch(() => setStatus("Abra seu resumo, copie-o e cole no assistente escolhido."));
  }

  return <div className={embedded ? "ai-study-dock embedded" : "ai-study-dock"}><button className="ai-study-trigger" onClick={() => { setOpen(!open); setStatus(""); }} aria-expanded={open}><span>✦</span>Estudar com IA</button>{open && <section className="ai-study-menu" aria-label="Escolher assistente de inteligência artificial"><div><p className="eyebrow">CONTINUAR O APRENDIZADO</p><h3>Escolha seu professor de IA</h3><p>O último resumo será copiado. Você decide quando colá-lo.</p></div><div className="ai-provider-grid">{providers.map((provider) => <button key={provider.name} onClick={() => launch(provider)}><span style={{ background: provider.color }}>{provider.mark}</span><strong>{provider.name}</strong><small>Copiar e abrir ↗</small></button>)}</div>{status && <p className="ai-copy-status">{status}</p>}<small>Nenhum resumo é enviado automaticamente.</small></section>}</div>;
}
