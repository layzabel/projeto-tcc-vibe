// Ícones desenhados em SVG: as telas infantis funcionam sem leitura.
type P = { size?: number; color?: string };

export function IconPlay({ size = 56 }: P) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect x="6" y="30" width="22" height="22" rx="4" fill="#ff6b6b" />
      <rect x="20" y="10" width="22" height="22" rx="4" fill="#4dabf7" />
      <circle cx="46" cy="42" r="12" fill="#ffd43b" />
      <path d="M38 38 q8 -6 16 0" stroke="#f08c00" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function IconBook({ size = 56 }: P) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M32 16 C24 10 12 10 6 13 V52 C12 49 24 49 32 55 z" fill="#ff8fab" stroke="#d6336c" strokeWidth="2" />
      <path d="M32 16 C40 10 52 10 58 13 V52 C52 49 40 49 32 55 z" fill="#ffc9de" stroke="#d6336c" strokeWidth="2" />
      <path d="M45 20 l2 4 4 .5 -3 3 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -3 4 -.5 z" fill="#ffd43b" />
    </svg>
  );
}

export function IconHeart({ size = 56, color = "#ff6b9a" }: P) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M32 55 C10 40 4 28 10 18 C16 9 28 10 32 20 C36 10 48 9 54 18 C60 28 54 40 32 55 z" fill={color} />
      <circle cx="22" cy="24" r="4" fill="#fff" opacity="0.6" />
    </svg>
  );
}

export function IconBack({ size = 40 }: P) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path d="M28 10 L14 24 L28 38" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHome({ size = 40 }: P) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path d="M8 24 L24 9 L40 24" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 22 V39 H35 V22" stroke="currentColor" strokeWidth="5" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAdult({ size = 26 }: P) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="10" r="6" fill="currentColor" />
      <path d="M5 30 c0 -9 5 -13 11 -13 s11 4 11 13 z" fill="currentColor" />
    </svg>
  );
}

export function IconFamily({ size = 44 }: P) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="22" cy="16" r="9" fill="#7b68c9" />
      <path d="M6 58 c0 -18 7 -26 16 -26 s16 8 16 26 z" fill="#7b68c9" />
      <circle cx="46" cy="30" r="7" fill="#ff922b" />
      <path d="M34 58 c0 -13 5 -19 12 -19 s12 6 12 19 z" fill="#ff922b" />
      <path d="M36 44 l-6 -4" stroke="#ff922b" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function IconBackspace({ size = 30 }: P) {
  return (
    <svg viewBox="0 0 40 32" width={size} height={size} aria-hidden="true">
      <path d="M12 4 H36 V28 H12 L2 16 z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M18 10 l12 12 M30 10 l-12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---------- Brinquedos do jogo ----------
export function ToyIcon({ kind, color, size = 64 }: { kind: string; color: string; size?: number }) {
  const dark = color === "#1c7ed6" ? "#1864ab" : "#c92a2a";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      {kind === "bola" && (
        <g>
          <circle cx="32" cy="32" r="24" fill={color} />
          <path d="M8 32 h48 M32 8 v48" stroke="#fff" strokeWidth="4" />
          <circle cx="32" cy="32" r="24" fill="none" stroke={dark} strokeWidth="3" />
        </g>
      )}
      {kind === "carro" && (
        <g>
          <path d="M8 40 V30 l8 -12 h22 l10 12 h8 v10 z" fill={color} stroke={dark} strokeWidth="3" strokeLinejoin="round" />
          <rect x="20" y="22" width="16" height="9" rx="2" fill="#e7f5ff" />
          <circle cx="20" cy="44" r="7" fill="#343a40" />
          <circle cx="46" cy="44" r="7" fill="#343a40" />
        </g>
      )}
      {kind === "urso" && (
        <g fill={color} stroke={dark} strokeWidth="3">
          <circle cx="16" cy="16" r="8" />
          <circle cx="48" cy="16" r="8" />
          <circle cx="32" cy="34" r="22" />
          <ellipse cx="32" cy="42" rx="9" ry="7" fill="#fff" stroke="none" />
          <circle cx="24" cy="30" r="3" fill="#212529" stroke="none" />
          <circle cx="40" cy="30" r="3" fill="#212529" stroke="none" />
          <circle cx="32" cy="40" r="3" fill="#212529" stroke="none" />
        </g>
      )}
      {kind === "bloco" && (
        <g>
          <rect x="10" y="10" width="44" height="44" rx="6" fill={color} stroke={dark} strokeWidth="3" />
          <text x="32" y="43" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">
            A
          </text>
        </g>
      )}
      {kind === "pato" && (
        <g>
          <ellipse cx="30" cy="42" rx="22" ry="14" fill={color} stroke={dark} strokeWidth="3" />
          <circle cx="42" cy="22" r="11" fill={color} stroke={dark} strokeWidth="3" />
          <path d="M52 22 l10 3 -10 4 z" fill="#ffa94d" />
          <circle cx="44" cy="19" r="2.5" fill="#212529" />
        </g>
      )}
      {kind === "estrela" && (
        <path
          d="M32 6 l7.6 16 17.4 2 -13 12 3.6 17.4 -15.6 -8.8 -15.6 8.8 3.6 -17.4 -13 -12 17.4 -2 z"
          fill={color}
          stroke={dark}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function BoxIcon({ color, size = 120 }: { color: string; size?: number }) {
  const dark = color === "#1c7ed6" ? "#1864ab" : "#c92a2a";
  return (
    <svg viewBox="0 0 120 100" width={size} height={(size * 100) / 120} aria-hidden="true">
      <path d="M10 34 H110 L102 96 H18 z" fill={color} stroke={dark} strokeWidth="4" strokeLinejoin="round" />
      <path d="M4 22 H116 V36 H4 z" fill={dark} />
      <rect x="44" y="52" width="32" height="10" rx="5" fill="#fff" opacity="0.5" />
    </svg>
  );
}

// ---------- Atividades do mundo real ----------
export function ActivityIcon({ kind, size = 72 }: { kind: "brinquedo" | "desenhar" | "abraco" | "livro"; size?: number }) {
  if (kind === "brinquedo") return <ToyIcon kind="urso" color="#c08b5c" size={size} />;
  if (kind === "livro") return <IconBook size={size} />;
  if (kind === "desenhar")
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <rect x="8" y="10" width="40" height="46" rx="4" fill="#fff" stroke="#adb5bd" strokeWidth="2" />
        <path d="M14 44 q8 -14 14 -4 t14 -8" stroke="#4dabf7" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="22" cy="22" r="6" fill="#ffd43b" />
        <g transform="rotate(35 48 30)">
          <rect x="44" y="6" width="9" height="40" rx="2" fill="#ff6b6b" />
          <path d="M44 46 h9 l-4.5 9 z" fill="#ffe3e3" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="22" cy="18" r="9" fill="#7b68c9" />
      <circle cx="42" cy="24" r="7" fill="#ff922b" />
      <path d="M8 58 c0 -18 6 -26 14 -26 s14 8 14 26 z" fill="#7b68c9" />
      <path d="M30 58 c0 -14 5 -20 12 -20 s12 6 12 20 z" fill="#ff922b" />
      <path d="M14 42 q14 10 34 0" stroke="#5b4b8a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M50 8 c-4 -4 -9 0 -5 4 l5 5 5 -5 c4 -4 -1 -8 -5 -4 z" fill="#ff6b9a" />
    </svg>
  );
}

export function FlowerIcon({ color = "#ff8fab", size = 48 }: P) {
  return (
    <svg viewBox="0 0 48 64" width={size} height={(size * 64) / 48} aria-hidden="true">
      <path d="M24 30 V62" stroke="#2f9e44" strokeWidth="4" />
      <path d="M24 48 q-10 -2 -12 -10 q10 0 12 10" fill="#40c057" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="24" cy="14" rx="7" ry="11" fill={color} transform={`rotate(${a} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="6" fill="#ffd43b" />
    </svg>
  );
}
