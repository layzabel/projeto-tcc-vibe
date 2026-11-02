"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppContext";
import Sky, { SCENE_FRACTION, type Scene } from "./Sky";
import Mascot from "./Mascot";
import Bubble from "./Bubble";
import { FlowerIcon, IconHome } from "./Icons";
import type { SoundName } from "@/lib/audio";
import type { Mood } from "@/lib/types";

type Effect = "risada" | "flores" | "luz" | "bocejo" | "respirar" | "dormir";

interface Page {
  scene: Scene;
  text: string;
  hint: string;
  effect: Effect;
  after: string;
  mood: Mood;
  sound: SoundName;
}

export const PAGES: Page[] = [
  { scene: "dia", text: "Oi! Eu sou o Lumi. Hoje foi um dia muito divertido!", hint: "Toque no Lumi", effect: "risada", after: "Hi hi hi! Que cócegas!", mood: "feliz", sound: "risada" },
  { scene: "tarde", text: "Antes de descansar, o Lumi rega as flores do jardim.", hint: "Toque para regar", effect: "flores", after: "Olha as flores nascendo!", mood: "feliz", sound: "brilho" },
  { scene: "tarde", text: "O sol está indo dormir, e a luz fica fraquinha.", hint: "Toque no céu", effect: "luz", after: "A luz ficou bem fraquinha.", mood: "calmo", sound: "tchau" },
  { scene: "anoitecer", text: "O Lumi está ficando com soninho...", hint: "Toque no Lumi", effect: "bocejo", after: "Aaaaah! Que bocejo grande!", mood: "sono", sound: "bocejo" },
  { scene: "anoitecer", text: "Vamos respirar juntinhos?", hint: "Toque e respire", effect: "respirar", after: "Puxa o ar devagar... e solta.", mood: "calmo", sound: "brilho" },
  { scene: "noite", text: "Boa noite! O Lumi apaga a luzinha e vai dormir.", hint: "Toque para dormir", effect: "dormir", after: "Shhh... o Lumi dormiu.", mood: "sono", sound: "tchau" },
];

const IDLE_MS = 15000;

interface Props {
  /** "mundo": aberta pela criança; "encerramento": parte do encerramento lúdico. */
  mode: "mundo" | "encerramento";
  onFinish: () => void;
}

/** História interativa: um toque faz o efeito da página, outro toque avança. */
export default function Story({ mode, onFinish }: Props) {
  const { goChild, sound, say } = useApp();
  const [page, setPage] = useState(0);
  const [active, setActive] = useState(false);
  const finished = useRef(false);
  const p = PAGES[page];

  const advance = () => {
    if (finished.current) return;
    if (!active) {
      setActive(true);
      sound(p.sound);
      say(p.after);
      return;
    }
    if (page < PAGES.length - 1) {
      setPage(page + 1);
      setActive(false);
    } else {
      finished.current = true;
      onFinish();
    }
  };

  useEffect(() => {
    say(p.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // No encerramento a história segue sozinha se ninguém tocar, para não travar.
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    if (mode !== "encerramento") return;
    const id = setTimeout(() => advanceRef.current(), IDLE_MS);
    return () => clearTimeout(id);
  }, [mode, page, active]);

  const fraction = p.effect === "luz" && active ? 0.32 : SCENE_FRACTION[p.scene];
  const mood: Mood =
    active && p.effect === "dormir" ? "dormindo" : active && p.effect === "risada" ? "festa" : p.mood;
  const showFlowers = page > 1 || (page === 1 && active);

  return (
    <Sky fraction={fraction} showFireflies={false} moon={p.scene === "noite"} dim={p.effect === "luz" && active}>
      <main className="story child-screen">
        <header className="child-top">
          {mode === "mundo" ? (
            <button type="button" className="icon-btn" aria-label="Voltar" onClick={goChild}>
              <IconHome size={40} />
            </button>
          ) : (
            <span />
          )}
          <div className="page-dots" aria-label={`Página ${page + 1} de ${PAGES.length}`}>
            {PAGES.map((_, i) => (
              <span key={i} className={i <= page ? "on" : ""} />
            ))}
          </div>
        </header>

        <button type="button" className="story-scene" onClick={advance} aria-label={active ? "Próxima página" : p.hint}>
          <div className="bubble-slot">
            <Bubble>{active ? p.after : p.text}</Bubble>
          </div>
          <div className={`story-mascot ${active && p.effect === "risada" ? "giggle" : ""}`}>
            {active && p.effect === "respirar" && <div className="breath-ring" aria-hidden="true" />}
            <Mascot mood={mood} size={170} effect={active && p.effect === "bocejo" ? "bocejo" : active && p.effect === "risada" ? "risada" : null} />
          </div>
          {showFlowers && (
            <div className={`flowers ${page === 1 && active ? "grow" : "grown"}`} aria-hidden="true">
              {["#ff8fab", "#ffd43b", "#b197fc", "#ff922b", "#74c0fc"].map((c, i) => (
                <span key={c} style={{ animationDelay: `${i * 0.25}s` }}>
                  <FlowerIcon color={c} size={44} />
                </span>
              ))}
            </div>
          )}
          <div className="tap-hint" aria-hidden="true">
            <span className="tap-dot" />
            <small>{active ? "Toque para continuar" : p.hint}</small>
          </div>
        </button>
      </main>
    </Sky>
  );
}
