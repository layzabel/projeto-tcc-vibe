// Sons sintetizados no próprio aparelho (Web Audio) e voz do sistema
// (speechSynthesis) usando apenas vozes locais: nada é enviado para fora.

export type SoundName = "acerto" | "toque" | "aviso" | "fim" | "festa" | "risada" | "bocejo" | "brilho" | "tchau";

/** Sons que tocam mesmo com os sons desligados. */
const ALWAYS: SoundName[] = ["aviso", "fim"];

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Deve ser chamado num gesto do usuário para liberar o áudio no celular. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

type Note = { f: number; t: number; d: number; to?: number; type?: OscillatorType; g?: number };

const SOUNDS: Record<SoundName, Note[]> = {
  acerto: [
    { f: 660, t: 0, d: 0.12 },
    { f: 880, t: 0.1, d: 0.12 },
    { f: 1320, t: 0.2, d: 0.25 },
  ],
  toque: [{ f: 520, t: 0, d: 0.08, g: 0.12 }],
  aviso: [
    { f: 784, t: 0, d: 0.5, type: "triangle" },
    { f: 659, t: 0.45, d: 0.5, type: "triangle" },
    { f: 784, t: 1.0, d: 0.5, type: "triangle" },
    { f: 659, t: 1.45, d: 0.7, type: "triangle" },
  ],
  fim: [
    { f: 784, t: 0, d: 0.5, type: "triangle" },
    { f: 659, t: 0.4, d: 0.5, type: "triangle" },
    { f: 523, t: 0.8, d: 0.5, type: "triangle" },
    { f: 392, t: 1.2, d: 1.1, type: "triangle" },
  ],
  festa: [
    { f: 523, t: 0, d: 0.12 },
    { f: 659, t: 0.12, d: 0.12 },
    { f: 784, t: 0.24, d: 0.12 },
    { f: 1047, t: 0.36, d: 0.2 },
    { f: 784, t: 0.56, d: 0.12 },
    { f: 1047, t: 0.68, d: 0.4 },
  ],
  risada: [
    { f: 900, t: 0, d: 0.09, to: 1100 },
    { f: 950, t: 0.14, d: 0.09, to: 1150 },
    { f: 1000, t: 0.28, d: 0.09, to: 1200 },
  ],
  bocejo: [{ f: 520, t: 0, d: 1.2, to: 220, type: "sine", g: 0.15 }],
  brilho: [
    { f: 1568, t: 0, d: 0.15, g: 0.08 },
    { f: 2093, t: 0.12, d: 0.25, g: 0.08 },
  ],
  tchau: [
    { f: 659, t: 0, d: 0.3, type: "triangle" },
    { f: 523, t: 0.3, d: 0.6, type: "triangle" },
  ],
};

export function playSound(name: SoundName, soundOn: boolean): void {
  if (!soundOn && !ALWAYS.includes(name)) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const start = c.currentTime + 0.02;
  for (const n of SOUNDS[name]) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.f, start + n.t);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, start + n.t + n.d);
    const peak = n.g ?? 0.2;
    gain.gain.setValueAtTime(0.0001, start + n.t);
    gain.gain.exponentialRampToValueAtTime(peak, start + n.t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.t + n.d);
    osc.connect(gain).connect(c.destination);
    osc.start(start + n.t);
    osc.stop(start + n.t + n.d + 0.05);
  }
}

// ---------- Voz ----------

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  // Apenas vozes locais (localService): vozes "online" enviariam o texto a terceiros.
  const local = window.speechSynthesis.getVoices().filter((v) => v.localService && v.lang.toLowerCase().startsWith("pt"));
  voice = local.find((v) => v.lang.toLowerCase() === "pt-br") ?? local[0] ?? null;
}

export function initVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  pickVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

export function hasLocalVoice(): boolean {
  if (!voice) pickVoice();
  return voice !== null;
}

export function speak(text: string, voiceOn: boolean): void {
  if (!voiceOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!voice) pickVoice();
  if (!voice) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.9;
  u.pitch = 1.25;
  synth.speak(u);
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}
