"use client";

import { DEFAULT_LIMIT, LIMIT_STEP, MAX_LIMIT, MIN_LIMIT, clampLimit } from "@/lib/time";

/** Escolha do limite diário: 15 a 60 minutos, em passos de 5 (nunca acima de 60). */
export default function LimitPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const set = (v: number) => onChange(clampLimit(v));
  return (
    <div className="stepper-block">
      <div className="stepper">
        <button type="button" className="btn round" aria-label="Diminuir 5 minutos" disabled={value <= MIN_LIMIT} onClick={() => set(value - LIMIT_STEP)}>
          −
        </button>
        <output className="stepper-value" aria-live="polite">
          {value} <small>min</small>
        </output>
        <button type="button" className="btn round" aria-label="Aumentar 5 minutos" disabled={value >= MAX_LIMIT} onClick={() => set(value + LIMIT_STEP)}>
          +
        </button>
      </div>
      <input
        type="range"
        min={MIN_LIMIT}
        max={MAX_LIMIT}
        step={LIMIT_STEP}
        value={value}
        aria-label="Limite diário em minutos"
        onChange={(e) => set(Number(e.target.value))}
      />
      <div className="range-labels">
        <span>{MIN_LIMIT} min</span>
        <span>{MAX_LIMIT} min (máximo)</span>
      </div>
      {value === DEFAULT_LIMIT && <p className="muted small">60 minutos é o máximo recomendado e o padrão.</p>}
    </div>
  );
}
