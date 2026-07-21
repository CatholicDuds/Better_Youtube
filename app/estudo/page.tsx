"use client";
/* eslint-disable @next/next/no-img-element -- thumbnails oficiais do YouTube em exportação estática */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { studyTracks, type StudyLanguage, type StudyLesson, type StudyVideo } from "../../lib/study";
import SectionSidebar from "../components/SectionSidebar";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const dayOptions = [
  { value: 1, label: "Seg" }, { value: 2, label: "Ter" }, { value: 3, label: "Qua" },
  { value: 4, label: "Qui" }, { value: 5, label: "Sex" }, { value: 6, label: "Sáb" }, { value: 0, label: "Dom" },
];

type LanguageMode = StudyLanguage | "both";
type StudySchedule = { enabled: boolean; days: number[]; time: string; duration: number; trackId: string; language: LanguageMode };

const defaultSchedule: StudySchedule = { enabled: false, days: [1, 3, 5], time: "19:00", duration: 45, trackId: "pensamento-critico", language: "both" };

function getScheduleStart(schedule: StudySchedule, now: number) {
  if (!schedule.enabled || !schedule.days.length || !now) return null;
  const [hours, minutes] = schedule.time.split(":").map(Number);
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);
    if (schedule.days.includes(candidate.getDay()) && candidate.getTime() > now) return candidate;
  }
  return null;
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function languageLabel(language: LanguageMode) {
  if (language === "pt") return "Português";
  if (language === "en") return "English";
  return "Português + English";
}

export default function StudyPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [trackId, setTrackId] = useState(studyTracks[0].id);
  const [language, setLanguage] = useState<LanguageMode>("both");
  const [schedule, setSchedule] = useState<StudySchedule>(defaultSchedule);
  const [progress, setProgress] = useState<string[]>([]);
  const [activeVideo, setActiveVideo] = useState<StudyVideo | null>(null);
  const [activeLesson, setActiveLesson] = useState<StudyLesson | null>(null);
  const [studyNote, setStudyNote] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  const [now, setNow] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(defaultSchedule.duration * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("clarity-theme") as "dark" | "light" | null;
      const storedLanguage = localStorage.getItem("clarity-study-language") as LanguageMode | null;
      const storedSchedule = localStorage.getItem("clarity-study-schedule");
      const storedProgress = localStorage.getItem("clarity-study-progress");
      if (storedTheme) setTheme(storedTheme);
      if (storedLanguage) setLanguage(storedLanguage);
      if (storedProgress) setProgress(JSON.parse(storedProgress));
      if (storedSchedule) {
        const parsed = { ...defaultSchedule, ...JSON.parse(storedSchedule) } as StudySchedule;
        setSchedule(parsed);
        setTrackId(parsed.trackId);
        setTimerSeconds(parsed.duration * 60);
      }
    } catch {}
    setNow(Date.now());
    const clock = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("clarity-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem("clarity-study-language", language); } catch {}
  }, [language]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => setTimerSeconds((current) => {
      if (current <= 1) {
        setTimerRunning(false);
        if ("Notification" in window && Notification.permission === "granted") new Notification("Sessão Clarity concluída", { body: "Feche o ciclo explicando o que aprendeu com suas palavras." });
        return 0;
      }
      return current - 1;
    }), 1_000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  const activeTrack = studyTracks.find((track) => track.id === trackId) || studyTracks[0];
  const completedInTrack = activeTrack.lessons.filter((lesson) => progress.includes(`${activeTrack.id}:${lesson.id}`)).length;
  const progressPercent = Math.round((completedInTrack / activeTrack.lessons.length) * 100);
  const nextLesson = activeTrack.lessons.find((lesson) => !progress.includes(`${activeTrack.id}:${lesson.id}`)) || activeTrack.lessons[activeTrack.lessons.length - 1];
  const nextSession = useMemo(() => getScheduleStart(schedule, now), [schedule, now]);
  const scheduledTrack = studyTracks.find((track) => track.id === schedule.trackId) || studyTracks[0];

  useEffect(() => {
    if (!nextSession || !("Notification" in window) || Notification.permission !== "granted") return;
    const wait = nextSession.getTime() - Date.now();
    if (wait <= 0 || wait > 2_147_000_000) return;
    const reminder = window.setTimeout(() => new Notification("Hora de estudar no Clarity", { body: `${scheduledTrack.title} · ${languageLabel(schedule.language)} · ${schedule.duration} minutos` }), wait);
    return () => window.clearTimeout(reminder);
  }, [nextSession, schedule.duration, schedule.language, scheduledTrack.title]);

  const scheduledNow = useMemo(() => {
    if (!schedule.enabled || !now || !schedule.days.includes(new Date(now).getDay())) return false;
    const [hours, minutes] = schedule.time.split(":").map(Number);
    const start = new Date(now); start.setHours(hours, minutes, 0, 0);
    return now >= start.getTime() && now <= start.getTime() + schedule.duration * 60_000;
  }, [schedule, now]);

  function toggleDay(day: number) {
    setSchedule((current) => ({ ...current, days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day] }));
    setScheduleStatus("");
  }

  function saveSchedule() {
    if (schedule.enabled && !schedule.days.length) { setScheduleStatus("Escolha pelo menos um dia da semana."); return; }
    try { localStorage.setItem("clarity-study-schedule", JSON.stringify(schedule)); } catch {}
    setScheduleStatus(schedule.enabled ? "Agenda salva neste dispositivo." : "Agenda desativada. O modo Estudo continua livre para acesso a qualquer hora.");
  }

  async function enableReminder() {
    if (!("Notification" in window)) { setScheduleStatus("Este navegador não oferece lembretes locais."); return; }
    const permission = await Notification.requestPermission();
    setScheduleStatus(permission === "granted" ? "Lembrete permitido enquanto o Clarity estiver aberto no navegador." : "Lembrete não autorizado. A agenda continua visível no Clarity.");
  }

  function beginSession() {
    setTrackId(schedule.enabled ? schedule.trackId : trackId);
    if (schedule.enabled) setLanguage(schedule.language);
    setTimerSeconds(schedule.duration * 60);
    setTimerRunning(true);
    window.setTimeout(() => document.getElementById("trilha")?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  function toggleLesson(lesson: StudyLesson) {
    const key = `${activeTrack.id}:${lesson.id}`;
    const next = progress.includes(key) ? progress.filter((item) => item !== key) : [...progress, key];
    setProgress(next);
    try { localStorage.setItem("clarity-study-progress", JSON.stringify(next)); } catch {}
  }

  function openVideo(video: StudyVideo, lesson: StudyLesson) {
    setActiveVideo(video);
    setActiveLesson(lesson);
    setStudyNote("");
    setNoteStatus("");
  }

  function saveStudyNote() {
    if (!activeVideo || !activeLesson || studyNote.trim().length < 80) return;
    const date = new Date();
    const entry = { date: date.toISOString(), track: activeTrack.title, lesson: activeLesson.title, video: activeVideo.title, language: activeVideo.language, note: studyNote.trim() };
    try {
      const previous = JSON.parse(localStorage.getItem("clarity-study-notes") || "[]");
      localStorage.setItem("clarity-study-notes", JSON.stringify([...previous, entry]));
    } catch {}
    const markdown = `# Sessão de estudo — ${activeTrack.title}\n\n- **Etapa:** ${activeLesson.title}\n- **Aula:** ${activeVideo.title}\n- **Canal:** ${activeVideo.channel}\n- **Idioma:** ${activeVideo.language === "pt" ? "Português" : "English"}\n- **Data:** ${date.toLocaleDateString("pt-BR")}\n\n## Explicação com minhas palavras\n${studyNote.trim()}\n\n## Princípio da etapa\n${activeLesson.principle}\n\n## Próximo teste\n${activeLesson.practice}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `clarity-estudo-${activeTrack.id}-${activeLesson.id}-${date.toISOString().slice(0, 10)}.md`; link.click(); URL.revokeObjectURL(url);
    setNoteStatus("Síntese salva no dispositivo e preparada para download.");
  }

  return (
    <div className="study-page section-page">
      <header className="study-topbar section-topbar">
        <a className="brand" href={`${BASE_PATH}/`}><span className="brand-mark">C</span><strong>Clarity</strong><sup>ESTUDO</sup></a>
        <nav aria-label="Navegação do modo estudo"><a href={`${BASE_PATH}/`}>Vídeos</a><a href={`${BASE_PATH}/leituras/`}>Leituras</a><a className="active" href={`${BASE_PATH}/estudo/`}>Estudo</a></nav>
        <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema">{theme === "dark" ? "☀" : "◐"}</button>
      </header>
      <SectionSidebar active="Modo Estudo" />

      <main className="study-content section-shell-content">
        <section className="study-hero">
          <div><p className="eyebrow">APRENDER EM CAMADAS, NÃO EM PEDAÇOS</p><h1>Seu mapa para estudar com direção.</h1><p>Escolha uma trilha, avance dos primeiros princípios à aplicação e feche cada aula explicando o que entendeu. Sem autoplay e sem pressa artificial.</p><div className="study-hero-actions"><button onClick={beginSession}>Começar agora</button><a href="#agenda">Programar horário</a></div></div>
          <div className={`focus-timer ${timerRunning ? "running" : ""}`}><p className="eyebrow">SESSÃO DE FOCO</p><strong>{formatTimer(timerSeconds)}</strong><span>{timerRunning ? `${activeTrack.title} · em andamento` : `${schedule.duration} minutos preparados`}</span><div><button onClick={() => { if (timerSeconds === 0) setTimerSeconds(schedule.duration * 60); setTimerRunning(!timerRunning); }}>{timerRunning ? "Pausar" : timerSeconds === 0 ? "Reiniciar" : "Iniciar"}</button><button onClick={() => { setTimerRunning(false); setTimerSeconds(schedule.duration * 60); }}>Zerar</button></div></div>
        </section>

        {scheduledNow && <section className="study-callout"><span>●</span><div><strong>Sua sessão programada está aberta</strong><p>{scheduledTrack.title} · {languageLabel(schedule.language)} · {schedule.duration} minutos</p></div><button onClick={beginSession}>Entrar na sessão</button></section>}

        <section className="study-schedule" id="agenda">
          <div className="schedule-intro"><p className="eyebrow">AGENDA OPCIONAL</p><h2>Estude quando quiser ou proteja um horário.</h2><p>A agenda fica neste dispositivo. Ela organiza a próxima sessão sem impedir o acesso livre ao mapa.</p>{schedule.enabled && nextSession && <div className="next-session"><span>Próxima sessão</span><strong>{nextSession.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}, {schedule.time}</strong><small>{scheduledTrack.title} · {languageLabel(schedule.language)}</small></div>}</div>
          <div className="schedule-form">
            <label className="schedule-switch"><input type="checkbox" checked={schedule.enabled} onChange={(event) => { setSchedule({ ...schedule, enabled: event.target.checked }); setScheduleStatus(""); }} /><span />Programar sessões</label>
            <div className="schedule-days" aria-label="Dias da semana">{dayOptions.map((day) => <button key={day.value} className={schedule.days.includes(day.value) ? "active" : ""} onClick={() => toggleDay(day.value)}>{day.label}</button>)}</div>
            <div className="schedule-fields"><label>Horário<input type="time" value={schedule.time} onChange={(event) => setSchedule({ ...schedule, time: event.target.value })} /></label><label>Duração<select value={schedule.duration} onChange={(event) => { const duration = Number(event.target.value); setSchedule({ ...schedule, duration }); if (!timerRunning) setTimerSeconds(duration * 60); }}><option value={25}>25 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={90}>90 min</option></select></label></div>
            <label>Trilha<select value={schedule.trackId} onChange={(event) => setSchedule({ ...schedule, trackId: event.target.value })}>{studyTracks.map((track) => <option key={track.id} value={track.id}>{track.title}</option>)}</select></label>
            <label>Idioma<select value={schedule.language} onChange={(event) => setSchedule({ ...schedule, language: event.target.value as LanguageMode })}><option value="pt">Português</option><option value="en">English</option><option value="both">Português + English</option></select></label>
            <div className="schedule-actions"><button onClick={saveSchedule}>Salvar agenda</button><button onClick={() => void enableReminder()}>Permitir lembrete</button></div>{scheduleStatus && <p className="schedule-status">{scheduleStatus}</p>}
          </div>
        </section>

        <section className="track-picker" aria-labelledby="track-title">
          <div><p className="eyebrow">MAPAS DE APRENDIZADO</p><h2 id="track-title">Escolha o problema que quer compreender</h2></div>
          <div className="language-picker" aria-label="Idioma dos vídeos"><span>Vídeos</span>{([['pt', 'Português'], ['en', 'English'], ['both', 'Ambos']] as const).map(([value, label]) => <button key={value} className={language === value ? "active" : ""} onClick={() => setLanguage(value)}>{label}</button>)}</div>
          <div className="track-tabs">{studyTracks.map((track) => <button key={track.id} className={trackId === track.id ? "active" : ""} style={{ "--track-color": track.color } as CSSProperties} onClick={() => setTrackId(track.id)}><span>{track.icon}</span><strong>{track.title}</strong><small>{track.lessons.length} etapas</small></button>)}</div>
        </section>

        <section className="learning-map" id="trilha" style={{ "--track-color": activeTrack.color } as CSSProperties}>
          <header><div><p className="eyebrow">TRILHA ATIVA · {languageLabel(language).toUpperCase()}</p><h2>{activeTrack.title}</h2><p>{activeTrack.description}</p></div><div className="track-progress"><strong>{progressPercent}%</strong><span>{completedInTrack}/{activeTrack.lessons.length} etapas</span><i><b style={{ width: `${progressPercent}%` }} /></i></div></header>
          <div className="track-outcome"><span>→</span><div><small>AO FINAL, VOCÊ CONSEGUIRÁ</small><strong>{activeTrack.outcome}</strong></div></div>
          <div className="map-path">{activeTrack.lessons.map((lesson, index) => {
            const key = `${activeTrack.id}:${lesson.id}`;
            const complete = progress.includes(key);
            const videos = language === "both" ? [lesson.videos.pt, lesson.videos.en] : [lesson.videos[language]];
            return <article className={`map-step ${complete ? "complete" : ""}`} key={lesson.id}>
              <div className="map-node"><span>{complete ? "✓" : index + 1}</span><small>{lesson.stage}</small></div>
              <div className="lesson-card"><div className="lesson-copy"><p>{lesson.stage} · etapa {index + 1}</p><h3>{lesson.title}</h3><span>{lesson.summary}</span><blockquote><b>Primeiro princípio</b>{lesson.principle}</blockquote><div className="lesson-practice"><b>Teste de compreensão</b>{lesson.practice}</div></div>
                <div className="lesson-videos">{videos.map((video) => <button key={video.id} onClick={() => openVideo(video, lesson)}><span className="lesson-thumbnail"><img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" /><i>▶</i><em>{video.language === "pt" ? "PT" : "EN"}</em></span><strong>{video.title}</strong><small>{video.channel}</small></button>)}</div>
                <button className="complete-step" onClick={() => toggleLesson(lesson)}>{complete ? "✓ Etapa concluída" : "Marcar como concluída"}</button>
              </div>
            </article>;
          })}</div>
          <footer className="map-next"><span>{progressPercent === 100 ? "Trilha concluída" : "Próxima etapa"}</span><strong>{progressPercent === 100 ? "Revise suas sínteses e ensine a trilha para alguém." : nextLesson.title}</strong></footer>
        </section>
      </main>

      {activeVideo && activeLesson && <div className="overlay study-video-overlay"><section className="study-player" role="dialog" aria-modal="true" aria-label={`Aula ${activeVideo.title}`}>
        <button className="reader-close" onClick={() => setActiveVideo(null)} aria-label="Fechar aula">×</button><div className="study-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?rel=0`} title={activeVideo.title} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
        <div className="study-player-copy"><p className="eyebrow">{activeVideo.language === "pt" ? "AULA EM PORTUGUÊS" : "LESSON IN ENGLISH"} · {activeLesson.stage.toUpperCase()}</p><h2>{activeVideo.title}</h2><span>{activeVideo.channel}</span><blockquote><b>Observe durante a aula</b>{activeLesson.principle}</blockquote><label>Explique com suas palavras<textarea value={studyNote} onChange={(event) => setStudyNote(event.target.value)} placeholder="Qual é a ideia central? Como ela funciona? Que evidência sustenta a explicação? Onde você ainda tem dúvida?" /></label><button disabled={studyNote.trim().length < 80} onClick={saveStudyNote}>Salvar e baixar síntese</button>{noteStatus && <small>{noteStatus}</small>}<em>Mínimo de 80 caracteres para evitar uma anotação superficial.</em></div>
      </section></div>}
    </div>
  );
}
