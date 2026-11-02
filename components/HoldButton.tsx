"use client";

import { useEffect, useRef, useState } from "react";
import { IconAdult } from "./Icons";

const HOLD_MS = 3000;

/** Botão discreto que precisa ser segurado por 3 segundos (acesso dos adultos). */
export default function HoldButton({ onComplete, label = "Sou o adulto" }: { onComplete: () => void; label?: string }) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const done = useRef(onComplete);
  done.current = onComplete;

  const stop = () => {
    start.current = null;
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(0);
  };

  const frame = () => {
    if (start.current === null) return;
    const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      stop();
      done.current();
      return;
    }
    raf.current = requestAnimationFrame(frame);
  };

  const begin = () => {
    if (start.current !== null) return;
    start.current = performance.now();
    raf.current = requestAnimationFrame(frame);
  };

  useEffect(() => stop, []);

  return (
    <button
      type="button"
      className="hold-btn"
      aria-label={`${label}: segure por 3 segundos`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        begin();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={stop}
      onBlur={stop}
      onContextMenu={(e) => e.preventDefault()}
      style={{ ["--p" as string]: `${progress * 360}deg` }}
    >
      <span className="hold-ring">
        <IconAdult size={20} />
      </span>
      <span className="hold-label">{progress > 0 ? "Segure…" : label}</span>
    </button>
  );
}
