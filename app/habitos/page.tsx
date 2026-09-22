"use client";

import { useEffect, useState, type FormEvent } from "react";
import { HABITS_KEY, RETURN_MESSAGE, addDays, bedtimeMinutes, createHabitDemo, dispositionSeries, formatBedtime, habitDay, isMinimumWindow, localDate, money, parseHabitStore, reviewMarkdown, weeklyReview, type HabitEntry, type HabitSettings, type HabitStore } from "../../lib/habits";
import styles from "./habits.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const DEMO_TODAY = "2026-09-20";
type Tab = "daily" | "review" | "settings";
const average = (value: number | null) => value === null ? "sem registro" : value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const shortDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

function download(text: string, name: string, type = "text/markdown;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function HabitsPage() {
  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  const [week, setWeek] = useState("");
  const [store, setStore] = useState<HabitStore | null>(null);
  const [tab, setTab] = useState<Tab>("daily");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [rawBackup, setRawBackup] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [demoStore, setDemoStore] = useState<HabitStore>(createHabitDemo);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    function load() {
      const currentDate = localDate();
      setToday(currentDate);
      setDate((current) => current || currentDate);
      setWeek((current) => current || currentDate);
      try {
        const raw = localStorage.getItem(HABITS_KEY);
        setRawBackup(raw);
        setStore(parseHabitStore(raw, currentDate));
        setError("");
        setRevision((current) => current + 1);
        const theme = localStorage.getItem("clarity-theme");
        if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
      } catch {
        setError("Não foi possível ler o diário local. Os dados existentes foram preservados; faça uma cópia antes de tentar recuperar o arquivo.");
      }
    }
    const timer = window.setTimeout(load, 0);
    const clock = window.setInterval(() => setToday(localDate()), 60_000);
    const onStorage = (event: StorageEvent) => { if (event.key === HABITS_KEY || event.key === null) load(); };
    window.addEventListener("storage", onStorage);
    return () => { window.clearTimeout(timer); window.clearInterval(clock); window.removeEventListener("storage", onStorage); };
  }, []);

  const current = demo ? demoStore : store;
  const currentToday = demo ? DEMO_TODAY : today;
  const selectedDate = demo && date > DEMO_TODAY ? DEMO_TODAY : date;
  const selectedWeek = demo && week > DEMO_TODAY ? DEMO_TODAY : week;

  function save(update: (value: HabitStore) => HabitStore) {
    if (demo) { setDemoStore(update(demoStore)); setStatus("Exemplo atualizado apenas na demonstração."); return; }
    if (error || !store) return;
    try {
      // Re-read to preserve other dates changed in a second tab before this save.
      const latest = parseHabitStore(localStorage.getItem(HABITS_KEY), today);
      const next = update(latest);
      localStorage.setItem(HABITS_KEY, JSON.stringify(next));
      setStore(next);
      const needsReturn = tab === "daily" && weeklyReview(next, selectedDate, currentToday).exceeded;
      setStatus(needsReturn ? `Salvo neste dispositivo. ${RETURN_MESSAGE}` : "Salvo neste dispositivo.");
    } catch {
      setStatus("Não foi possível salvar. Seus campos continuam nesta tela; tente novamente ou exporte a revisão já salva.");
    }
  }

  function saveDaily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry: HabitEntry = { date: selectedDate };
    const numeric = (name: string) => { const value = String(form.get(name) ?? "").trim(); return value === "" ? undefined : Number(value); };
    entry.bedtime = String(form.get("bedtime") || "") || undefined;
    entry.instagramMinutes = numeric("instagramMinutes");
    entry.youtube = String(form.get("youtube") || "") as HabitEntry["youtube"] || undefined;
    entry.pages = numeric("pages"); entry.hobbySpend = numeric("hobbySpend");
    entry.payment = String(form.get("payment") || "") as HabitEntry["payment"] || undefined;
    entry.disposition = numeric("disposition"); entry.trigger = String(form.get("trigger") || "").trim() || undefined;
    if (current && isMinimumWindow(selectedDate, current.settings)) entry.minimumDone = form.get("minimumDone") === "on";
    save((value) => ({ ...value, entries: { ...value.entries, [entry.date]: entry } }));
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const settings: HabitSettings = { habitName: String(form.get("habitName")).trim(), minimumVersion: String(form.get("minimumVersion")).trim(), startDate: String(form.get("startDate")), instagramLimit: Number(form.get("instagramLimit")), bedtimeTarget: String(form.get("bedtimeTarget")), readingDays: Number(form.get("readingDays")), hobbyBudget: Number(form.get("hobbyBudget")) };
    save((value) => ({ ...value, settings }));
  }

  function toggleDemo() {
    setDemo(!demo); setTab("review"); setStatus("");
    setDate(demo ? today : DEMO_TODAY); setWeek(demo ? today : DEMO_TODAY);
    setRevision((value) => value + 1);
  }

  const entry = current?.entries[selectedDate];
  const review = current && selectedWeek ? weeklyReview(current, selectedWeek, currentToday) : null;
  const minimum = Boolean(current && selectedDate && isMinimumWindow(selectedDate, current.settings));
  const points = current && review ? dispositionSeries(current, review.end < currentToday ? review.end : currentToday) : [];
  const over = (value: number | null, target: number) => value === null ? "sem registro" : value <= target ? "dentro do limite informado" : "acima do limite informado";

  return <main className={styles.page}>
    <header className={styles.header}><a href={`${BASE_PATH}/`}>C <span>Clarity</span></a><h1>Hábitos</h1><button type="button" onClick={toggleDemo}>{demo ? "Sair da demo" : "Ver exemplo"}</button></header>
    {demo && <p className={styles.demo}>Demonstração fictícia · 31/08–20/09/2026 · nada é gravado no seu diário.</p>}
    <nav className={styles.tabs} aria-label="Hábitos">
      {([["daily", "Registro"], ["review", "Revisão"], ["settings", "Ajustes"]] as const).map(([key, label]) => <button type="button" key={key} aria-current={tab === key ? "page" : undefined} onClick={() => { setTab(key); setStatus(""); }}>{label}</button>)}
    </nav>
    {!demo && error && <section className={styles.notice} role="alert"><p>{error}</p>{rawBackup !== null && <button onClick={() => download(rawBackup, "clarity-habitos-copia-original.json", "application/json")}>Baixar cópia original</button>}</section>}
    {!current && !error && <p role="status">Abrindo seu diário local…</p>}

    {current && tab === "daily" && <section className={styles.daily}>
      <div className={styles.dateRow}><p>Até 1 minuto · tudo opcional</p><input aria-label="Data do registro" type="date" required max={currentToday} value={selectedDate} onChange={(event) => { if (event.target.value) { setDate(event.target.value); setStatus(""); } }} /></div>
      <form key={`${demo}-${selectedDate}-${revision}`} onSubmit={saveDaily}>
        <div className={styles.grid}>
          <label>Dormi ontem às<input name="bedtime" type="time" defaultValue={entry?.bedtime ?? ""} /></label>
          <label>Instagram · min<input name="instagramMinutes" type="number" inputMode="numeric" min="0" max="1440" step="1" placeholder="Celular dedicado" defaultValue={entry?.instagramMinutes ?? ""} /></label>
          <label>YouTube de hoje<select name="youtube" defaultValue={entry?.youtube ?? ""}><option value="">Sem informar</option><option value="intentional">Intencional</option><option value="reactive">Reativo</option><option value="unused">Não usei</option></select></label>
          <label>Leitura · páginas<input name="pages" type="number" inputMode="numeric" min="0" max="100000" step="1" placeholder="0 também vale" defaultValue={entry?.pages ?? ""} /></label>
          <label>Hobby hoje · R$<input name="hobbySpend" type="number" inputMode="decimal" min="0" max="1000000" step="0.01" placeholder="Valor total da compra" defaultValue={entry?.hobbySpend ?? ""} /></label>
          <label>Pagamento<select name="payment" defaultValue={entry?.payment ?? ""}><option value="">Sem informar</option><option value="cash">À vista</option><option value="installments">Parcelado</option></select></label>
          <label className={styles.wide}>Disposição para {current.settings.habitName} · 0–10<input name="disposition" type="number" inputMode="numeric" min="0" max="10" step="1" placeholder="Como estou hoje?" defaultValue={entry?.disposition ?? ""} /></label>
          <label className={styles.wide}>O que disparou a vontade?<input name="trigger" type="text" maxLength={160} placeholder="Uma linha, se quiser" defaultValue={entry?.trigger ?? ""} /></label>
        </div>
        {minimum && <label className={styles.minimum}><input type="checkbox" name="minimumDone" defaultChecked={entry?.minimumDone ?? false} /><span>Dia {habitDay(selectedDate, current.settings.startDate)} · {current.settings.minimumVersion}<small>Fiz a versão mínima: meta cumprida.</small></span></label>}
        <button className={styles.primary} disabled={!demo && Boolean(error)} type="submit">Salvar registro</button>
        <p className={styles.status} role="status">{status || (entry ? "Você pode editar o registro deste dia." : "Leia os minutos no Bem-estar Digital do celular dedicado.")}</p>
      </form>
    </section>}

    {current && review && tab === "review" && <section className={styles.review}>
      <div className={styles.week}><button aria-label="Semana anterior" onClick={() => setWeek(addDays(review.start, -7))}>←</button><div><h2>{shortDate(review.start)} a {shortDate(review.end)}</h2><p>{review.recordedDays}/{review.elapsedDays} dias decorridos com registro</p></div><button aria-label="Próxima semana" disabled={review.end >= currentToday} onClick={() => setWeek(addDays(review.start, 7))}>→</button></div>
      <p className={styles.help}>Médias só dos campos informados. Dias vazios são “sem registro”. Semana de segunda a domingo.</p>
      <div className={styles.cards}>
        <article><h3>Instagram</h3><strong>{average(review.instagramAverage)}{review.instagramAverage !== null && " min/dia"}</strong><p>Limite {current.settings.instagramLimit} min · {over(review.instagramAverage, current.settings.instagramLimit)}</p><small>{review.instagramCount} valores informados</small></article>
        <article><h3>Hora de dormir</h3><strong>{formatBedtime(review.bedtimeAverage)}</strong><p>Alvo {current.settings.bedtimeTarget} · {over(review.bedtimeAverage, bedtimeMinutes(current.settings.bedtimeTarget))}</p><small>{review.bedtimeCount} valores · horários após meia-noite pertencem à mesma noite</small></article>
        <article><h3>Leitura</h3><strong>{review.pagesCount ? `${review.readingDays}/${current.settings.readingDays} dias` : "sem registro"}</strong><p>{average(review.pagesAverage)} páginas em média · {review.pagesCount} valores</p><small>{review.readingDays >= current.settings.readingDays ? "Meta semanal cumprida." : "Contagem dos dias com páginas lidas; a semana pode estar incompleta."}</small></article>
        <article><h3>Hobby · {selectedWeek.slice(0, 7)}</h3><strong>{review.monthlySpend === null ? "sem registro" : money(review.monthlySpend)}</strong><p>Teto {money(current.settings.hobbyBudget)} · {over(review.monthlySpend, current.settings.hobbyBudget)}</p><small>{review.spendingDays} dias com valor informado; some o valor total da compra.</small>{review.installments.length > 0 && <p className={styles.attention}>{review.installments.length} compra(s) parcelada(s): compromisso com meses futuros.</p>}</article>
      </div>
      <p className={styles.help}>YouTube: {review.youtube.intentional} intencional · {review.youtube.reactive} reativo · {review.youtube.unused} não usei. Disposição média: {average(review.dispositionAverage)}/10.</p>
      {review.minimumDays > 0 && <p className={styles.notice}>Meta cumprida pela versão mínima em {review.minimumDays} dia(s) desta semana.</p>}
      {review.exceeded && <p className={styles.notice}>{RETURN_MESSAGE}</p>}
      <section className={styles.chart}><h2>Disposição · últimos 21 dias</h2><p>Faixa sombreada: dias 10–25 desde {shortDate(current.settings.startDate)}. Versão mínima: {current.settings.minimumVersion}.</p>
        <svg viewBox="0 0 630 160" role="img" aria-label="Disposição de zero a dez nos últimos 21 dias; lacunas não são conectadas. Valores também disponíveis na tabela abaixo.">
          {[0, 5, 10].map((value) => <g key={value}><text x="0" y={134 - value * 11}>{value}</text><line x1="28" x2="625" y1={130 - value * 11} y2={130 - value * 11} className={styles.axis} /></g>)}
          {points.map((point, index) => <g key={point.date}>
            {point.minimum && <rect x={30 + index * 29 - 13} y="12" width="29" height="122" className={styles.band} />}
            {point.value !== null && <><title>{point.date}: {point.value}/10{point.minimum ? `; dia ${point.day}, versão mínima` : ""}</title>{index > 0 && points[index - 1].value !== null && <line x1={30 + (index - 1) * 29} y1={130 - points[index - 1].value! * 11} x2={30 + index * 29} y2={130 - point.value * 11} className={styles.line} />}<circle cx={30 + index * 29} cy={130 - point.value * 11} r="3.5" /></>}
            {index % 5 === 0 && <text x={30 + index * 29} y="154" textAnchor="middle">{shortDate(point.date)}</text>}
          </g>)}
        </svg>
        <details><summary>Ver valores e dias sem registro</summary><table><thead><tr><th>Data</th><th>Disposição</th><th>Hábito atual</th></tr></thead><tbody>{points.map((point) => <tr key={point.date}><td>{shortDate(point.date)}</td><td>{point.value ?? "sem registro"}</td><td>{point.minimum ? `Dia ${point.day}: versão mínima` : "—"}</td></tr>)}</tbody></table></details>
      </section>
      <div className={styles.days}>{review.dates.map((day) => <span key={day}><b>{shortDate(day)}</b>{day > currentToday ? "ainda não chegou" : current.entries[day] ? "registrado" : "sem registro"}</span>)}</div>
      <button className={styles.primary} onClick={() => download(reviewMarkdown(current, selectedWeek, currentToday), `clarity-habitos-${review.start}${demo ? "-exemplo" : ""}.md`)}>Exportar revisão em Markdown</button>
    </section>}

    {current && tab === "settings" && <section className={styles.settings}><h2>Seus limites, seu ritmo</h2><p>Referências para a revisão. Ajustá-las não apaga registros nem reinicia seu histórico.</p>
      <form key={`${demo}-${revision}`} onSubmit={saveSettings}><div className={styles.grid}>
        <label className={styles.wide}>Hábito principal<input name="habitName" required maxLength={80} defaultValue={current.settings.habitName} /></label>
        <label>Data de início<input name="startDate" type="date" required max={currentToday} defaultValue={current.settings.startDate} /></label>
        <label>Instagram · limite diário<input name="instagramLimit" type="number" min="0" max="1440" step="1" required defaultValue={current.settings.instagramLimit} /><small>Sugestão: 20–30 minutos</small></label>
        <label className={styles.wide}>Versão mínima · dias 10–25<input name="minimumVersion" required maxLength={120} placeholder="Ex.: ler 2 páginas" defaultValue={current.settings.minimumVersion} /></label>
        <label>Dormir · horário alvo<input name="bedtimeTarget" type="time" required defaultValue={current.settings.bedtimeTarget} /></label>
        <label>Leitura · dias por semana<input name="readingDays" type="number" min="0" max="7" step="1" required defaultValue={current.settings.readingDays} /></label>
        <label className={styles.wide}>Hobby · teto mensal (R$)<input name="hobbyBudget" type="number" min="0" max="1000000" step="0.01" required defaultValue={current.settings.hobbyBudget} /></label>
      </div><button className={styles.primary} disabled={!demo && Boolean(error)} type="submit">Salvar ajustes</button><p className={styles.status} role="status">{status}</p></form>
    </section>}
  </main>;
}
