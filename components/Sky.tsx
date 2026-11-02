import type { ReactNode } from "react";

export type Scene = "dia" | "tarde" | "anoitecer" | "noite";

/** Fração de tempo restante que representa cada cenário. */
export const SCENE_FRACTION: Record<Scene, number> = { dia: 1, tarde: 0.6, anoitecer: 0.28, noite: 0 };

type RGB = [number, number, number];
const STOPS: { f: number; top: RGB; bottom: RGB; ground: RGB }[] = [
  { f: 0, top: [14, 20, 56], bottom: [42, 47, 107], ground: [27, 58, 52] },
  { f: 0.28, top: [75, 63, 143], bottom: [229, 143, 168], ground: [54, 98, 72] },
  { f: 0.6, top: [255, 158, 107], bottom: [255, 213, 158], ground: [96, 166, 84] },
  { f: 1, top: [94, 200, 255], bottom: [207, 241, 255], ground: [118, 200, 98] },
];

function mix(a: RGB, b: RGB, t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function colorsAt(f: number) {
  const x = Math.min(1, Math.max(0, f));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (x <= b.f) {
      const t = (x - a.f) / (b.f - a.f);
      return { top: mix(a.top, b.top, t), bottom: mix(a.bottom, b.bottom, t), ground: mix(a.ground, b.ground, t) };
    }
  }
  const last = STOPS[STOPS.length - 1];
  return { top: mix(last.top, last.top, 0), bottom: mix(last.bottom, last.bottom, 0), ground: mix(last.ground, last.ground, 0) };
}

const STARS = [
  [8, 8, 1.2], [20, 18, 0.8], [33, 6, 1], [47, 14, 1.4], [62, 5, 0.9], [74, 17, 1.1], [88, 9, 1.3], [94, 24, 0.8],
  [14, 30, 1], [40, 27, 0.8], [56, 33, 1.1], [80, 31, 0.9], [27, 40, 0.7], [68, 42, 1], [5, 46, 0.8], [90, 44, 1.2],
];

const FIREFLIES = [
  [14, 52], [32, 44], [50, 56], [68, 45], [86, 53],
];

interface Props {
  /** 1 = dia inteiro pela frente; 0 = noite. */
  fraction: number;
  /** Quantos dos 5 vaga-lumes ainda brilham; padrão: segue a fração. */
  fireflies?: number;
  showFireflies?: boolean;
  /** Mostra a lua (noite do bloqueio / história). */
  moon?: boolean;
  /** Diminui a luz (efeito da história). */
  dim?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Céu que mostra o tempo restante sem números: o sol desce, a tarde chega,
 * anoitece, surgem estrelas e os vaga-lumes se apagam um a um.
 */
export default function Sky({ fraction, fireflies, showFireflies = true, moon = false, dim = false, children, className = "" }: Props) {
  const f = Math.min(1, Math.max(0, fraction));
  const c = colorsAt(f);
  const sunY = 12 + (1 - f) * 70;
  const sunColor = f > 0.6 ? "#ffd43b" : f > 0.28 ? "#ff922b" : "#ff6b6b";
  const starOpacity = Math.min(1, Math.max(0, (0.5 - f) / 0.4));
  const lit = fireflies ?? Math.ceil(f * 5 - 1e-9);

  return (
    <div className={`sky ${dim ? "sky-dim" : ""} ${className}`} style={{ background: `linear-gradient(${c.top}, ${c.bottom})` }}>
      <svg className="sky-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {STARS.map(([x, y, r], i) => (
          <circle key={i} className="star" cx={x} cy={y} r={r * 0.45} fill="#fff" opacity={starOpacity} style={{ animationDelay: `${i * 0.37}s` }} />
        ))}
      </svg>
      <div
        className="sun"
        aria-hidden="true"
        style={{ top: `${sunY}%`, background: sunColor, boxShadow: `0 0 40px 12px ${sunColor}88`, opacity: f > 0.02 ? 1 : 0 }}
      />
      {moon && <div className="moon" aria-hidden="true" />}
      {showFireflies && (
        <div className="fireflies" aria-label={`${lit} de 5 vaga-lumes acesos`} role="img">
          {FIREFLIES.map(([x, y], i) => (
            <span key={i} className={`firefly ${i < lit ? "on" : "off"}`} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.6}s` }} />
          ))}
        </div>
      )}
      <svg className="ground" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 8 Q25 0 50 7 T100 6 V20 H0 z" fill={c.ground} />
      </svg>
      <div className="sky-content">{children}</div>
    </div>
  );
}
