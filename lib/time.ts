import type { AppData, DayRecord, Mood, Settings, Today } from "./types.ts";

export const MIN_LIMIT = 15;
export const MAX_LIMIT = 60;
export const LIMIT_STEP = 5;
export const DEFAULT_LIMIT = 60;
export const MIN_WARN = 1;
export const MAX_WARN = 15;
export const DEFAULT_WARN = 5;
export const HISTORY_DAYS = 30;
/**
 * Maior intervalo aceito entre duas medições. Intervalos maiores (aparelho
 * suspenso, aba congelada, relógio alterado) são descartados acima desse teto.
 */
export const MAX_TICK_MS = 3000;
const MINUTE = 60_000;

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + n, 12));
}

export function clampLimit(min: number): number {
  if (!Number.isFinite(min)) return DEFAULT_LIMIT;
  const stepped = Math.round(min / LIMIT_STEP) * LIMIT_STEP;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, stepped));
}

/** Aviso entre 1 e 15 minutos e sempre menor que o limite diário. */
export function clampWarn(warn: number, limitMin: number): number {
  if (!Number.isFinite(warn)) warn = DEFAULT_WARN;
  const max = Math.min(MAX_WARN, clampLimit(limitMin) - 1);
  return Math.min(max, Math.max(MIN_WARN, Math.round(warn)));
}

export function newToday(date: string, limitMin: number): Today {
  return {
    date,
    usedMs: 0,
    limitMin: clampLimit(limitMin),
    closed: false,
    warned: false,
    invited: false,
    forceEnd: false,
    locked: false,
  };
}

export function limitMs(today: Today): number {
  return clampLimit(today.limitMin) * MINUTE;
}

export function remainingMs(today: Today): number {
  if (today.forceEnd || today.locked) return 0;
  return Math.max(0, limitMs(today) - today.usedMs);
}

/** Acabou o tempo do dia (por consumo ou por "Encerrar agora"). */
export function isExhausted(today: Today): boolean {
  return today.forceEnd || today.locked || today.usedMs >= limitMs(today);
}

/** Fração do tempo que ainda resta (1 = dia inteiro, 0 = acabou). */
export function remainingFraction(today: Today): number {
  return remainingMs(today) / limitMs(today);
}

/**
 * Soma ao tempo usado um intervalo medido com relógio monotônico,
 * descartando saltos anormais. Nunca ultrapassa o limite do dia.
 */
export function applyElapsed(today: Today, deltaMs: number): Today {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0 || isExhausted(today)) return today;
  const delta = Math.min(deltaMs, MAX_TICK_MS);
  return { ...today, usedMs: Math.min(limitMs(today), today.usedMs + delta) };
}

export function effectiveWarnMin(settings: Settings, today: Today): number {
  return clampWarn(settings.warnMin, today.limitMin);
}

export function shouldWarn(today: Today, settings: Settings): boolean {
  if (today.warned || isExhausted(today)) return false;
  return remainingMs(today) <= effectiveWarnMin(settings, today) * MINUTE;
}

export function moodFor(today: Today, settings: Settings): Mood {
  if (today.locked) return "dormindo";
  if (isExhausted(today) || remainingMs(today) <= effectiveWarnMin(settings, today) * MINUTE) return "sono";
  return remainingFraction(today) > 0.5 ? "feliz" : "calmo";
}

export function toRecord(today: Today): DayRecord {
  return { date: today.date, usedMs: today.usedMs, limitMin: today.limitMin, closed: today.closed };
}

/** Mantém apenas os últimos 30 dias anteriores a hoje. */
export function pruneHistory(history: DayRecord[], todayKey: string): DayRecord[] {
  const oldest = addDays(todayKey, -HISTORY_DAYS);
  const byDate = new Map<string, DayRecord>();
  for (const r of history) {
    if (r.date >= oldest && r.date < todayKey) byDate.set(r.date, r);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Virada do dia: arquiva o dia atual e começa um novo, zerado e liberado,
 * com o limite configurado. Relógio voltando para trás não altera nada.
 */
export function rollover(data: AppData, nowKey: string): AppData {
  if (nowKey <= data.today.date) return data;
  return {
    ...data,
    history: pruneHistory([...data.history, toRecord(data.today)], nowKey),
    today: newToday(nowKey, data.settings.dailyLimitMin),
  };
}

export function minutesOf(ms: number): number {
  return Math.round(ms / MINUTE);
}

export interface DayPoint {
  date: string;
  minutes: number;
  limitMin: number;
  closed: boolean;
  recorded: boolean;
}

/** Últimos `days` dias (incluindo hoje), com zero nos dias sem registro. */
export function lastDays(data: AppData, days: number): DayPoint[] {
  const map = new Map<string, DayRecord>();
  for (const r of data.history) map.set(r.date, r);
  map.set(data.today.date, toRecord(data.today));
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(data.today.date, -i);
    const r = map.get(date);
    out.push({
      date,
      minutes: r ? minutesOf(r.usedMs) : 0,
      limitMin: r ? r.limitMin : 0,
      closed: r ? r.closed : false,
      recorded: !!r,
    });
  }
  return out;
}

/** Resumo dos últimos 7 dias (incluindo hoje). */
export function weekSummary(data: AppData) {
  const points = lastDays(data, 7);
  const first = points[0].date;
  const records = [...data.history.filter((r) => r.date >= first), toRecord(data.today)];
  const totalMs = records.reduce((s, r) => s + r.usedMs, 0);
  return {
    points,
    totalMin: minutesOf(totalMs),
    averageMin: Math.round(totalMs / 7 / MINUTE),
    daysWithUse: records.filter((r) => r.usedMs >= MINUTE / 2).length,
  };
}

export function msUntilMidnight(now: Date): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
}

export function formatDuration(ms: number): string {
  const totalMin = Math.ceil(ms / MINUTE);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatDate(key: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "2-digit" }): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", opts);
}
