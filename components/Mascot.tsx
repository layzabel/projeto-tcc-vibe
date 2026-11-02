import type { Mood } from "@/lib/types";

interface Props {
  mood: Mood;
  size?: number;
  /** Efeito pontual de animação (ex.: risada, bocejo). */
  effect?: "risada" | "bocejo" | null;
  className?: string;
}

const GLOW: Record<Mood, number> = { feliz: 1, festa: 1, calmo: 0.75, sono: 0.45, dormindo: 0.2 };

function Eyes({ mood, effect }: { mood: Mood; effect?: Props["effect"] }) {
  if (effect === "bocejo" || mood === "dormindo") {
    return (
      <g stroke="#2b2350" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M70 82 q10 8 20 0" />
        <path d="M110 82 q10 8 20 0" />
      </g>
    );
  }
  if (mood === "festa" || effect === "risada") {
    return (
      <g stroke="#2b2350" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M70 84 q10 -12 20 0" />
        <path d="M110 84 q10 -12 20 0" />
      </g>
    );
  }
  const r = mood === "feliz" ? 11 : 10;
  return (
    <g>
      <circle cx="80" cy="80" r={r} fill="#2b2350" />
      <circle cx="120" cy="80" r={r} fill="#2b2350" />
      <circle cx="84" cy="76" r="3.5" fill="#fff" />
      <circle cx="124" cy="76" r="3.5" fill="#fff" />
      {mood === "sono" && (
        <g fill="#8f7fd6">
          <path d="M67 80 a13 13 0 0 1 26 0 z" />
          <path d="M107 80 a13 13 0 0 1 26 0 z" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood, effect }: { mood: Mood; effect?: Props["effect"] }) {
  if (effect === "bocejo") return <ellipse cx="100" cy="106" rx="9" ry="12" fill="#2b2350" />;
  if (mood === "festa" || effect === "risada")
    return <path d="M82 98 q18 24 36 0 z" fill="#2b2350" stroke="#2b2350" strokeWidth="3" strokeLinejoin="round" />;
  if (mood === "feliz") return <path d="M86 100 q14 14 28 0" stroke="#2b2350" strokeWidth="5" fill="none" strokeLinecap="round" />;
  if (mood === "calmo") return <path d="M89 102 q11 8 22 0" stroke="#2b2350" strokeWidth="4.5" fill="none" strokeLinecap="round" />;
  if (mood === "sono") return <ellipse cx="100" cy="104" rx="5" ry="6" fill="#2b2350" />;
  return <path d="M93 104 q7 4 14 0" stroke="#2b2350" strokeWidth="4" fill="none" strokeLinecap="round" />;
}

/** Lumi, o vaga-lume mascote. */
export default function Mascot({ mood, size = 180, effect = null, className = "" }: Props) {
  const glow = GLOW[mood];
  return (
    <div
      className={`mascot mood-${mood} ${effect ? `fx-${effect}` : ""} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Lumi, o vaga-lume, ${mood === "dormindo" ? "dormindo" : mood === "sono" ? "com sono" : mood === "festa" ? "festejando" : mood}`}
    >
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <radialGradient id="lumi-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff6a8" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#ffe14d" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffe14d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lumi-belly" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fffbd1" />
            <stop offset="100%" stopColor="#ffd23f" />
          </radialGradient>
        </defs>
        <circle className="mascot-glow" cx="100" cy="150" r="58" fill="url(#lumi-glow)" opacity={glow} />
        <g className="mascot-body">
          <g className="mascot-wings" fill="#dff3ff" stroke="#b7dcf5" strokeWidth="2" opacity="0.9">
            {/* A inclinação fica no <g>; a animação CSS age só na elipse, sem conflito de transform. */}
            <g transform="rotate(-30 58 122)">
              <ellipse className="wing-l" cx="58" cy="122" rx="30" ry="18" />
            </g>
            <g transform="rotate(30 142 122)">
              <ellipse className="wing-r" cx="142" cy="122" rx="30" ry="18" />
            </g>
          </g>
          <ellipse cx="100" cy="152" rx="32" ry="30" fill="url(#lumi-belly)" opacity={0.55 + glow * 0.45} />
          <path d="M74 142 q26 10 52 0" stroke="#e8b923" strokeWidth="3" fill="none" opacity="0.6" />
          <g stroke="#5b4b8a" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M84 42 q-10 -22 -24 -24" />
            <path d="M116 42 q10 -22 24 -24" />
          </g>
          <circle cx="59" cy="18" r="7" fill="#ffe14d" opacity={0.4 + glow * 0.6} />
          <circle cx="141" cy="18" r="7" fill="#ffe14d" opacity={0.4 + glow * 0.6} />
          <circle cx="100" cy="86" r="46" fill="#7b68c9" />
          <circle cx="100" cy="86" r="46" fill="none" stroke="#5b4b8a" strokeWidth="3" />
          <circle cx="68" cy="98" r="8" fill="#ff9ec4" opacity="0.7" />
          <circle cx="132" cy="98" r="8" fill="#ff9ec4" opacity="0.7" />
          <Eyes mood={mood} effect={effect} />
          <Mouth mood={mood} effect={effect} />
          {mood === "festa" && (
            <g>
              <path d="M84 44 L100 6 L116 44 z" fill="#ff6b9a" stroke="#d94a7a" strokeWidth="2" />
              <circle cx="100" cy="6" r="6" fill="#ffe14d" />
            </g>
          )}
        </g>
        {mood === "dormindo" && (
          <g className="mascot-zzz" fill="#fff" fontFamily="system-ui, sans-serif" fontWeight="700">
            <text x="150" y="60" fontSize="22">z</text>
            <text x="164" y="40" fontSize="28">z</text>
            <text x="180" y="18" fontSize="34">Z</text>
          </g>
        )}
        {mood === "festa" && (
          <g className="mascot-confetti">
            <rect x="20" y="40" width="10" height="10" fill="#ff6b9a" transform="rotate(20 25 45)" />
            <rect x="170" y="70" width="10" height="10" fill="#4dabf7" transform="rotate(-20 175 75)" />
            <circle cx="30" cy="110" r="6" fill="#51cf66" />
            <circle cx="178" cy="130" r="6" fill="#ffd43b" />
            <rect x="160" y="20" width="8" height="14" fill="#ffd43b" transform="rotate(35 164 27)" />
          </g>
        )}
      </svg>
    </div>
  );
}
