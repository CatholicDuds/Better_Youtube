export const HABITS_KEY = "clarity-habits-v1";
export const RETURN_MESSAGE = "Volte amanhã, sem compensar e sem recomeçar do zero.";
export type HabitEntry = {
  date: string;
  bedtime?: string;
  instagramMinutes?: number;
  youtube?: "intentional" | "reactive" | "unused";
  pages?: number;
  hobbySpend?: number;
  payment?: "cash" | "installments";
  disposition?: number;
  trigger?: string;
  minimumDone?: boolean;
};
export type HabitSettings = {
  instagramLimit: number;
  bedtimeTarget: string;
  readingDays: number;
  hobbyBudget: number;
  startDate: string;
  habitName: string;
  minimumVersion: string;
};
export type HabitStore = { version: 1; settings: HabitSettings; entries: Record<string, HabitEntry> };
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function defaultHabitSettings(today = localDate()): HabitSettings {
  return { instagramLimit: 25, bedtimeTarget: "23:00", readingDays: 5, hobbyBudget: 250, startDate: today, habitName: "Leitura", minimumVersion: "Ler 2 páginas" };
}
export function emptyHabitStore(today = localDate()): HabitStore { return { version: 1, settings: defaultHabitSettings(today), entries: {} }; }
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const time = (value: unknown): value is string => typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const number = (value: unknown, max: number, integer = false): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max && (!integer || Number.isInteger(value));

export function parseHabitStore(raw: string | null, today = localDate()): HabitStore {
  if (raw === null) return emptyHabitStore(today);
  const data: unknown = JSON.parse(raw);
  // Fail closed on incompatible data: the UI must not overwrite an unreadable journal.
  if (!record(data) || data.version !== 1 || !record(data.settings) || !record(data.entries)) throw new Error("Formato de diário não reconhecido.");
  const defaults = defaultHabitSettings(today), s = data.settings;
  const settings: HabitSettings = {
    instagramLimit: number(s.instagramLimit, 1440, true) ? s.instagramLimit : defaults.instagramLimit,
    bedtimeTarget: time(s.bedtimeTarget) ? s.bedtimeTarget : defaults.bedtimeTarget,
    readingDays: number(s.readingDays, 7, true) ? s.readingDays : defaults.readingDays,
    hobbyBudget: number(s.hobbyBudget, 1000000) ? s.hobbyBudget : defaults.hobbyBudget,
    startDate: isDate(s.startDate) ? s.startDate : defaults.startDate,
    habitName: typeof s.habitName === "string" && s.habitName.trim() ? s.habitName.slice(0, 80) : defaults.habitName,
    minimumVersion: typeof s.minimumVersion === "string" && s.minimumVersion.trim() ? s.minimumVersion.slice(0, 120) : defaults.minimumVersion,
  };
  const entries: Record<string, HabitEntry> = {};
  for (const [date, value] of Object.entries(data.entries)) {
    if (!isDate(date) || !record(value) || value.date !== date) throw new Error("Há um registro diário incompatível.");
    const entry: HabitEntry = { date };
    if (time(value.bedtime)) entry.bedtime = value.bedtime;
    if (number(value.instagramMinutes, 1440, true)) entry.instagramMinutes = value.instagramMinutes;
    if (["intentional", "reactive", "unused"].includes(String(value.youtube))) entry.youtube = value.youtube as HabitEntry["youtube"];
    if (number(value.pages, 100000, true)) entry.pages = value.pages;
    if (number(value.hobbySpend, 1000000)) entry.hobbySpend = value.hobbySpend;
    if (["cash", "installments"].includes(String(value.payment))) entry.payment = value.payment as HabitEntry["payment"];
    if (number(value.disposition, 10, true)) entry.disposition = value.disposition;
    if (typeof value.trigger === "string") entry.trigger = value.trigger.slice(0, 160);
    if (typeof value.minimumDone === "boolean") entry.minimumDone = value.minimumDone;
    entries[date] = entry;
  }
  return { version: 1, settings, entries };
}

export function habitDay(date: string, start: string) {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000) + 1;
}
export function isMinimumWindow(date: string, settings: HabitSettings) {
  const day = habitDay(date, settings.startDate);
  return day >= 10 && day <= 25;
}
// No average across the midnight discontinuity: 23:00 and 01:00 average to 00:00.
export function bedtimeMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes + (hours < 12 ? 1440 : 0);
}
export function formatBedtime(value: number | null) {
  if (value === null) return "sem registro";
  const minutes = Math.round(value) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
export function weeklyReview(store: HabitStore, reference: string, today = localDate()) {
  const weekday = new Date(`${reference}T12:00:00Z`).getUTCDay();
  const start = addDays(reference, -(weekday + 6) % 7);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const elapsedDates = dates.filter((date) => date <= today);
  const entries = elapsedDates.flatMap((date) => store.entries[date] ? [store.entries[date]] : []);
  const instagram = entries.flatMap((entry) => entry.instagramMinutes === undefined ? [] : [entry.instagramMinutes]);
  const bedtimes = entries.flatMap((entry) => entry.bedtime === undefined ? [] : [bedtimeMinutes(entry.bedtime)]);
  const pages = entries.flatMap((entry) => entry.pages === undefined ? [] : [entry.pages]);
  const disposition = entries.flatMap((entry) => entry.disposition === undefined ? [] : [entry.disposition]);
  const monthEntries = Object.values(store.entries).filter((entry) => entry.date.startsWith(reference.slice(0, 7)) && entry.date <= today);
  const spendEntries = monthEntries.filter((entry) => entry.hobbySpend !== undefined);
  const monthlySpend = spendEntries.length ? Math.round(spendEntries.reduce((sum, entry) => sum + Math.round(entry.hobbySpend! * 100), 0)) / 100 : null;
  const installments = monthEntries.filter((entry) => entry.payment === "installments");
  const instagramAverage = mean(instagram), bedtimeAverage = mean(bedtimes);
  const exceeded = (monthlySpend !== null && monthlySpend > store.settings.hobbyBudget) || installments.length > 0 || entries.some((entry) => entry.youtube === "reactive" || (entry.instagramMinutes !== undefined && entry.instagramMinutes > store.settings.instagramLimit) || (entry.bedtime !== undefined && bedtimeMinutes(entry.bedtime) > bedtimeMinutes(store.settings.bedtimeTarget)));
  return {
    start, end: dates[6], dates, entries, elapsedDays: elapsedDates.length, recordedDays: entries.length,
    instagramAverage, instagramCount: instagram.length, bedtimeAverage, bedtimeCount: bedtimes.length,
    pagesAverage: mean(pages), pagesCount: pages.length, readingDays: pages.filter((value) => value > 0).length,
    dispositionAverage: mean(disposition), dispositionCount: disposition.length,
    monthlySpend, spendingDays: spendEntries.length, installments, exceeded,
    youtube: { intentional: entries.filter((entry) => entry.youtube === "intentional").length, reactive: entries.filter((entry) => entry.youtube === "reactive").length, unused: entries.filter((entry) => entry.youtube === "unused").length },
    minimumDays: entries.filter((entry) => isMinimumWindow(entry.date, store.settings) && entry.minimumDone).length,
  };
}

export function dispositionSeries(store: HabitStore, end: string, length = 21) {
  return Array.from({ length }, (_, i) => {
    const date = addDays(end, i - length + 1);
    return { date, value: store.entries[date]?.disposition ?? null, minimum: isMinimumWindow(date, store.settings), day: habitDay(date, store.settings.startDate) };
  });
}
export const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const textNumber = (value: number | null) => value === null ? "sem registro" : value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
export function reviewMarkdown(store: HabitStore, reference: string, today = localDate()) {
  const r = weeklyReview(store, reference, today), s = store.settings;
  const yesNo = (over: boolean) => over ? "acima do limite" : "dentro do limite";
  const status = (value: number | null, target: number) => value === null ? "sem registro" : yesNo(value > target);
  const safe = (value: string) => value.replace(/[\r\n|]/g, " ").replace(/([\\`*_<>])/g, "\\$1");
  const rows = r.dates.map((date) => {
    const e = store.entries[date];
    if (date > today) return `| ${date} | ainda não chegou | — | — | — | — | — | — | — |`;
    if (!e) return `| ${date} | sem registro | — | — | — | — | — | — | — |`;
    const use = e.youtube === "intentional" ? "intencional" : e.youtube === "reactive" ? "reativo" : e.youtube === "unused" ? "não usei" : "sem registro";
    const payment = e.payment === "cash" ? "à vista" : e.payment === "installments" ? "parcelado" : "sem registro";
    const minimum = isMinimumWindow(date, s) && e.minimumDone ? "meta cumprida (versão mínima)" : "—";
    return `| ${date} | ${e.bedtime ?? "sem registro"} | ${e.instagramMinutes ?? "sem registro"} | ${use} | ${e.pages ?? "sem registro"} | ${e.hobbySpend === undefined ? "sem registro" : money(e.hobbySpend)} / ${payment} | ${e.disposition ?? "sem registro"} | ${minimum} | ${safe(e.trigger || "")} |`;
  });
  return `# Revisão de hábitos — ${r.start} a ${r.end}\n\nHábito: ${safe(s.habitName)}. Início: ${s.startDate}. Versão mínima: ${safe(s.minimumVersion)}.\n\n${r.recordedDays}/${r.elapsedDays} dias decorridos com registro. Dias ausentes não são falhas. Médias usam apenas valores informados (zero é válido).\n\n- Instagram: ${textNumber(r.instagramAverage)} min/dia (${r.instagramCount} registros); limite ${s.instagramLimit}: ${status(r.instagramAverage, s.instagramLimit)}.\n- Dormir: ${formatBedtime(r.bedtimeAverage)} (${r.bedtimeCount} registros); alvo ${s.bedtimeTarget}: ${status(r.bedtimeAverage, bedtimeMinutes(s.bedtimeTarget))}.\n- Leitura: ${r.readingDays} dias com páginas > 0; alvo ${s.readingDays} dias/semana; média ${textNumber(r.pagesAverage)} páginas (${r.pagesCount} registros).\n- Hobby em ${reference.slice(0, 7)}: ${r.monthlySpend === null ? "sem registro" : money(r.monthlySpend)}; teto ${money(s.hobbyBudget)}: ${status(r.monthlySpend, s.hobbyBudget)}. Somente despesas informadas.\n- Compras parceladas registradas no mês: ${r.installments.length}${r.installments.length ? " — atenção ao compromisso futuro" : ""}.\n- YouTube: ${r.youtube.intentional} intencional, ${r.youtube.reactive} reativo, ${r.youtube.unused} não usei.\n- Disposição média: ${textNumber(r.dispositionAverage)}/10 (${r.dispositionCount} registros).\n- Meta cumprida pela versão mínima (dias 10–25): ${r.minimumDays} dias.\n\n${r.exceeded ? RETURN_MESSAGE + "\n\n" : ""}| Dia | Dormir ontem | Instagram (min) | YouTube | Páginas | Hobby / pagamento | Disposição | Versão mínima | O que disparou a vontade? |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\n## Disposição — últimos 21 dias\n\n${dispositionSeries(store, r.end < today ? r.end : today).map((point) => `- ${point.date}: ${point.value ?? "sem registro"}${point.minimum ? ` (dia ${point.day}; versão mínima)` : ""}`).join("\n")}\n`;
}

export function createHabitDemo(): HabitStore {
  const store = emptyHabitStore("2026-08-31");
  for (let i = 0; i < 21; i++) {
    if ([2, 6, 10, 15, 19].includes(i)) continue;
    const date = addDays("2026-08-31", i);
    store.entries[date] = { date, bedtime: i % 4 === 0 ? "00:30" : "22:50", instagramMinutes: [15, 30, 0, 45][i % 4], youtube: i % 5 === 0 ? "reactive" : "intentional", pages: i % 4 === 0 ? 0 : i >= 9 ? 2 : 8, hobbySpend: i === 5 ? 180 : i === 12 ? 90 : 0, payment: i === 12 ? "installments" : "cash", disposition: [8, 7, 6, 5, 4, 3, 5][i % 7], minimumDone: i >= 9 && i % 4 !== 0, trigger: i === 12 ? "Exemplo fictício: promoção depois de um dia cansativo." : "" };
  }
  return store;
}
