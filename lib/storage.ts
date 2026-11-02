import type { AppData, ClosingStyle, DayRecord, Settings, Today } from "./types.ts";
import { DEFAULT_LIMIT, DEFAULT_WARN, clampLimit, clampWarn, dateKey, newToday, pruneHistory, rollover } from "./time.ts";

export const STORAGE_KEY = "lumi:dados:v1";
export const CONSENT_TEXT_VERSION = "2026-11-v1";

const STYLES: ClosingStyle[] = ["respiracao", "historia", "simples"];

export function defaultSettings(reducedMotion = false): Settings {
  return {
    dailyLimitMin: DEFAULT_LIMIT,
    warnMin: DEFAULT_WARN,
    closingStyle: "respiracao",
    sound: true,
    voice: true,
    reducedMotion,
  };
}

/** Cria os dados no momento do consentimento: nada é guardado antes disso. */
export function createData(now: Date, reducedMotion: boolean): AppData {
  const settings = defaultSettings(reducedMotion);
  return {
    schema: 1,
    consent: { acceptedAt: now.toISOString(), textVersion: CONSENT_TEXT_VERSION },
    childName: "",
    settings,
    pin: null,
    setupDone: false,
    today: newToday(dateKey(now), settings.dailyLimitMin),
    history: [],
  };
}

const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

function sanitizeRecord(r: Partial<DayRecord> | undefined): DayRecord | null {
  if (!r || typeof r.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return null;
  const limitMin = clampLimit(num(r.limitMin, DEFAULT_LIMIT));
  return {
    date: r.date,
    limitMin,
    usedMs: Math.min(limitMin * 60_000, Math.max(0, num(r.usedMs, 0))),
    closed: bool(r.closed, false),
  };
}

/** Valida dados lidos do armazenamento: o limite nunca passa de 60 minutos. */
export function sanitize(raw: unknown, now: Date): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<AppData>;
  if (!d.consent || typeof d.consent.acceptedAt !== "string") return null;

  const s = (d.settings ?? {}) as Partial<Settings>;
  const dailyLimitMin = clampLimit(num(s.dailyLimitMin, DEFAULT_LIMIT));
  const settings: Settings = {
    dailyLimitMin,
    warnMin: clampWarn(num(s.warnMin, DEFAULT_WARN), dailyLimitMin),
    closingStyle: STYLES.includes(s.closingStyle as ClosingStyle) ? (s.closingStyle as ClosingStyle) : "respiracao",
    sound: bool(s.sound, true),
    voice: bool(s.voice, true),
    reducedMotion: bool(s.reducedMotion, false),
  };

  const key = dateKey(now);
  const t = d.today as Partial<Today> | undefined;
  const base = sanitizeRecord(t);
  const today: Today = base
    ? {
        ...base,
        warned: bool(t?.warned, false),
        invited: bool(t?.invited, false),
        forceEnd: bool(t?.forceEnd, false),
        locked: bool(t?.locked, false),
      }
    : newToday(key, dailyLimitMin);

  const history = Array.isArray(d.history)
    ? d.history.map((r) => sanitizeRecord(r)).filter((r): r is DayRecord => r !== null)
    : [];

  const pin =
    d.pin && typeof d.pin.salt === "string" && typeof d.pin.hash === "string"
      ? { salt: d.pin.salt, hash: d.pin.hash }
      : null;

  const data: AppData = {
    schema: 1,
    consent: { acceptedAt: d.consent.acceptedAt, textVersion: String(d.consent.textVersion ?? CONSENT_TEXT_VERSION) },
    childName: typeof d.childName === "string" ? d.childName.slice(0, 18) : "",
    settings,
    pin,
    setupDone: bool(d.setupDone, false) && pin !== null,
    today,
    history: pruneHistory(history, today.date),
  };
  return rollover(data, key);
}

export function loadData(now = new Date()): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw), now) : null;
  } catch {
    return null;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Armazenamento cheio ou bloqueado: a contagem segue na memória.
  }
}

/** Apaga todos os dados do aparelho (equivale a retirar o consentimento). */
export function eraseAll(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith("lumi:")) localStorage.removeItem(k);
    }
  } catch {}
}

export function exportJson(data: AppData, now = new Date()): string {
  return JSON.stringify(
    {
      aplicativo: "Lumi – tempo de tela",
      exportadoEm: now.toISOString(),
      observacao: "Todos os dados guardados neste aparelho. A senha aparece apenas cifrada (hash), nunca legível.",
      dados: data,
    },
    null,
    2,
  );
}
