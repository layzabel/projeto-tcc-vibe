export type ClosingStyle = "respiracao" | "historia" | "simples";

export interface Settings {
  /** Limite diário (15–60 min). Alterações valem a partir do dia seguinte. */
  dailyLimitMin: number;
  /** Minutos antes do fim em que o aviso de "falta pouco" toca (1–15). */
  warnMin: number;
  closingStyle: ClosingStyle;
  sound: boolean;
  voice: boolean;
  reducedMotion: boolean;
}

/** Registro de um dia, como fica guardado no histórico. */
export interface DayRecord {
  /** Data local no formato AAAA-MM-DD. */
  date: string;
  usedMs: number;
  /** Limite que estava valendo naquele dia. */
  limitMin: number;
  /** Se o encerramento aconteceu no dia. */
  closed: boolean;
}

/** Dia atual: registro do dia + controles internos de fluxo. */
export interface Today extends DayRecord {
  warned: boolean;
  invited: boolean;
  /** O responsável acionou "Encerrar agora". */
  forceEnd: boolean;
  /** Encerramento concluído: tela bloqueada até o dia seguinte. */
  locked: boolean;
}

export interface Consent {
  acceptedAt: string;
  textVersion: string;
}

export interface PinHash {
  salt: string;
  hash: string;
}

export interface AppData {
  schema: 1;
  consent: Consent;
  childName: string;
  settings: Settings;
  pin: PinHash | null;
  setupDone: boolean;
  today: Today;
  history: DayRecord[];
}

export type Mood = "feliz" | "calmo" | "sono" | "dormindo" | "festa";
