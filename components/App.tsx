"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppContext, COUNTING_SCREENS, type AppCtx, type Screen } from "./AppContext";
import type { AppData } from "@/lib/types";
import { STORAGE_KEY, eraseAll, loadData, saveData } from "@/lib/storage";
import { applyElapsed, dateKey, isExhausted, rollover, shouldWarn } from "@/lib/time";
import { initVoices, playSound, speak, stopSpeech, unlockAudio, type SoundName } from "@/lib/audio";
import { WARNING } from "@/lib/phrases";
import Setup from "./Setup";
import World from "./World";
import Game from "./Game";
import Story from "./Story";
import Closing from "./Closing";
import Locked from "./Locked";
import AdultGate from "./AdultGate";
import Panel from "./Panel";
import Mascot from "./Mascot";

const SAVE_EVERY_MS = 5000;

function routeFor(d: AppData | null): Screen {
  if (!d || !d.setupDone) return "setup";
  if (d.today.locked) return "locked";
  if (isExhausted(d.today)) return "closing";
  return "world";
}

/** Junta dados vindos de outra aba aberta, sem nunca diminuir o tempo usado. */
function mergeFromOtherTab(cur: AppData | null, incoming: AppData | null): AppData | null {
  if (!cur || !incoming || cur.today.date !== incoming.today.date) return incoming;
  const a = cur.today;
  const b = incoming.today;
  return {
    ...incoming,
    today: {
      ...b,
      usedMs: Math.max(a.usedMs, b.usedMs),
      warned: a.warned || b.warned,
      invited: a.invited || b.invited,
      forceEnd: a.forceEnd || b.forceEnd,
      locked: a.locked || b.locked,
      closed: a.closed || b.closed,
    },
  };
}

export default function App() {
  const dataRef = useRef<AppData | null>(null);
  const [, setVersion] = useState(0);
  const [screen, setScreen] = useState<Screen>("loading");
  const screenRef = useRef<Screen>("loading");
  const [closingRun, setClosingRun] = useState(0);
  const [warnFlash, setWarnFlash] = useState(false);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const render = useCallback(() => setVersion((v) => v + 1), []);

  const persist = useCallback(() => {
    if (dataRef.current) saveData(dataRef.current);
    dirty.current = false;
  }, []);

  const flush = useCallback(() => {
    if (dirty.current) persist();
  }, [persist]);

  const go = useCallback(
    (s: Screen) => {
      flush();
      stopSpeech();
      // Cada entrada no encerramento é uma execução nova: a anterior é desmontada.
      if (s === "closing") setClosingRun((r) => r + 1);
      screenRef.current = s;
      setScreen(s);
    },
    [flush],
  );

  const goChild = useCallback(() => go(routeFor(dataRef.current)), [go]);

  const mutate = useCallback<AppCtx["mutate"]>(
    (fn, p = true) => {
      const d = dataRef.current;
      if (!d) return;
      dataRef.current = fn(d);
      if (p) persist();
      else dirty.current = true;
      render();
    },
    [persist, render],
  );

  const replaceData = useCallback(
    (d: AppData | null) => {
      dataRef.current = d;
      if (d) saveData(d);
      else eraseAll();
      dirty.current = false;
      render();
    },
    [render],
  );

  const sound = useCallback((name: SoundName) => playSound(name, dataRef.current?.settings.sound ?? true), []);
  const say = useCallback((text: string) => speak(text, dataRef.current?.settings.voice ?? false), []);

  const endNow = useCallback(() => {
    mutate((d) => ({ ...d, today: { ...d.today, forceEnd: true } }));
    go("closing");
  }, [mutate, go]);

  const finishClosing = useCallback(() => {
    mutate((d) => ({ ...d, today: { ...d.today, locked: true, closed: true } }));
    go("locked");
  }, [mutate, go]);

  // Carregamento inicial (somente no navegador).
  useEffect(() => {
    initVoices();
    const d = loadData();
    dataRef.current = d;
    if (d) saveData(d); // grava eventual virada de dia ocorrida com o app fechado
    go(routeFor(d));
    render();

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => {
          const urls = performance
            .getEntriesByType("resource")
            .map((e) => e.name)
            .filter((u) => u.startsWith(location.origin));
          reg.active?.postMessage({ type: "cache-urls", urls });
        })
        .catch(() => {});
    }
  }, [go, render]);

  // Relógio da contagem: usa tempo monotônico (performance.now), não o relógio do aparelho.
  useEffect(() => {
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      const d = dataRef.current;
      if (!d) return;

      const key = dateKey(new Date());
      if (key > d.today.date) {
        dataRef.current = rollover(d, key);
        persist();
        render();
        if (screenRef.current === "locked" || screenRef.current === "closing") go("world");
        return;
      }

      if (!d.setupDone || !COUNTING_SCREENS.has(screenRef.current)) return;
      if (document.visibilityState !== "visible" || isExhausted(d.today)) return;

      let today = applyElapsed(d.today, delta);
      const warnNow = shouldWarn(today, d.settings);
      if (warnNow) today = { ...today, warned: true };
      dataRef.current = { ...d, today };
      dirty.current = true;

      if (warnNow) {
        persist();
        playSound("aviso", true); // toca sempre, mesmo com sons desligados
        speak(WARNING, d.settings.voice);
        setWarnFlash(true);
        if (warnTimer.current) clearTimeout(warnTimer.current);
        warnTimer.current = setTimeout(() => setWarnFlash(false), 9000);
      }
      if (isExhausted(today)) {
        persist();
        go("closing");
      }
      render();
    };

    const onVisibility = () => {
      last = performance.now();
      if (document.visibilityState === "hidden") {
        flush();
        stopSpeech();
      } else tick();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const incoming = mergeFromOtherTab(dataRef.current, loadData());
      dataRef.current = incoming;
      render();
      if (!incoming || !incoming.setupDone) go("setup");
      else if (screenRef.current !== "gate" && screenRef.current !== "panel") {
        const target = routeFor(incoming);
        if (target !== "world" && target !== screenRef.current) go(target);
      }
    };

    const id = setInterval(tick, 1000);
    const saveId = setInterval(flush, SAVE_EVERY_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    window.addEventListener("storage", onStorage);
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    return () => {
      clearInterval(id);
      clearInterval(saveId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pointerdown", unlockAudio);
      flush();
    };
  }, [flush, go, persist, render]);

  const data = dataRef.current;
  const ctx = useMemo<AppCtx>(
    () => ({
      data,
      mutate,
      replaceData,
      go,
      goChild,
      openAdult: () => go("gate"),
      endNow,
      finishClosing,
      sound,
      say,
      warnFlash,
    }),
    [data, mutate, replaceData, go, goChild, endNow, finishClosing, sound, say, warnFlash],
  );

  const reduced = data?.settings.reducedMotion ?? false;
  const isChild = screen === "world" || screen === "game" || screen === "story" || screen === "closing" || screen === "locked";

  return (
    <AppContext.Provider value={ctx}>
      <div className={`app ${reduced ? "reduce-motion" : ""} ${isChild ? "child" : "adult"}`}>
        {screen === "loading" && <div className="loading" aria-busy="true" />}
        {screen === "setup" && <Setup />}
        {screen === "world" && data && <World />}
        {screen === "game" && data && <Game />}
        {screen === "story" && data && <Story mode="mundo" onFinish={goChild} />}
        {screen === "closing" && data && <Closing key={closingRun} />}
        {screen === "locked" && data && <Locked />}
        {screen === "gate" && <AdultGate />}
        {screen === "panel" && data && <Panel />}
        {warnFlash && (screen === "game" || screen === "story") && (
          <div className="warn-toast" role="status">
            <Mascot mood="sono" size={64} />
            <span>Falta pouquinho!</span>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
