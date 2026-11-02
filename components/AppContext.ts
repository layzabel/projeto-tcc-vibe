"use client";

import { createContext, useContext } from "react";
import type { SoundName } from "@/lib/audio";
import type { AppData } from "@/lib/types";

export type Screen = "loading" | "setup" | "world" | "game" | "story" | "closing" | "locked" | "gate" | "panel";

/** Telas infantis em que o tempo de tela é contado. */
export const COUNTING_SCREENS: ReadonlySet<Screen> = new Set(["world", "game", "story"]);

export interface AppCtx {
  data: AppData | null;
  /** Altera os dados; `persist` grava imediatamente no aparelho. */
  mutate: (fn: (d: AppData) => AppData, persist?: boolean) => void;
  /** Substitui todos os dados (configuração inicial / apagar tudo). */
  replaceData: (d: AppData | null) => void;
  go: (s: Screen) => void;
  /** Volta para a tela infantil adequada (configuração, bloqueio, encerramento ou mundo). */
  goChild: () => void;
  openAdult: () => void;
  /** Encerrar agora (responsável): inicia o encerramento lúdico. */
  endNow: () => void;
  /** Conclui o encerramento e bloqueia até o dia seguinte. */
  finishClosing: () => void;
  sound: (name: SoundName) => void;
  say: (text: string) => void;
  /** Aviso de "falta pouco" acabou de tocar. */
  warnFlash: boolean;
}

export const AppContext = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp fora do AppContext");
  return ctx;
}

/** Atalho para quando a tela só existe com dados configurados. */
export function useData(): AppData {
  const { data } = useApp();
  if (!data) throw new Error("Dados ausentes");
  return data;
}
