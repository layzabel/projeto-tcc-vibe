"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppContext";
import Mascot from "./Mascot";
import Bubble from "./Bubble";
import { BoxIcon, IconHome, ToyIcon } from "./Icons";
import { GAME_DONE, GAME_INTRO, TRY_AGAIN, pick } from "@/lib/phrases";
import type { Mood } from "@/lib/types";

type BoxColor = "azul" | "vermelho";
interface Toy {
  id: string;
  kind: string;
  box: BoxColor;
}

const HEX: Record<BoxColor, string> = { azul: "#1c7ed6", vermelho: "#e03131" };

const TOYS: Toy[] = [
  { id: "bola", kind: "bola", box: "azul" },
  { id: "carro", kind: "carro", box: "vermelho" },
  { id: "urso", kind: "urso", box: "azul" },
  { id: "bloco", kind: "bloco", box: "vermelho" },
  { id: "pato", kind: "pato", box: "azul" },
  { id: "estrela", kind: "estrela", box: "vermelho" },
];

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Jogo "Guardar os brinquedos": toque no brinquedo e depois na caixa da mesma cor. */
export default function Game() {
  const { goChild, sound, say } = useApp();
  const [toys] = useState(() => shuffle(TOYS));
  const [stored, setStored] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [bubble, setBubble] = useState(GAME_INTRO);
  const [mood, setMood] = useState<Mood>("feliz");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = stored.length === toys.length;

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  useEffect(() => {
    say(GAME_INTRO);
    const list = timers.current;
    return () => list.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tapToy = (id: string) => {
    if (done || stored.includes(id)) return;
    sound("toque");
    setWrong(null);
    setSelected((s) => (s === id ? null : id));
  };

  const tapBox = (box: BoxColor) => {
    if (done || !selected) return;
    const toy = toys.find((t) => t.id === selected)!;
    if (toy.box === box) {
      const next = [...stored, toy.id];
      setStored(next);
      setSelected(null);
      sound("acerto");
      if (next.length === toys.length) {
        setMood("festa");
        setBubble(GAME_DONE);
        later(() => sound("festa"), 400);
        say(GAME_DONE);
        later(goChild, 5000);
      } else {
        setMood("festa");
        setBubble("Isso! Guardou!");
        later(() => setMood("feliz"), 1200);
      }
    } else {
      // Caixa errada: o brinquedo volta para o lugar, sem som de erro.
      const text = pick(TRY_AGAIN);
      setWrong(toy.id);
      setSelected(null);
      setMood("calmo");
      setBubble(text);
      say(text);
      later(() => setWrong(null), 700);
      later(() => setMood("feliz"), 1500);
    }
  };

  return (
    <main className="game child-screen">
      <header className="child-top">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={goChild}>
          <IconHome size={40} />
        </button>
        <div className="progress-stars" aria-label={`${stored.length} de ${toys.length} brinquedos guardados`}>
          {toys.map((t, i) => (
            <span key={t.id} className={i < stored.length ? "on" : ""}>
              ★
            </span>
          ))}
        </div>
      </header>

      <div className="game-mascot">
        <Mascot mood={mood} size={done ? 150 : 96} />
        <Bubble>{bubble}</Bubble>
      </div>

      <div className="toys" role="group" aria-label="Brinquedos">
        {toys.map((t) => {
          const isStored = stored.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className={`toy ${selected === t.id ? "selected" : ""} ${wrong === t.id ? "wrong" : ""} ${isStored ? "stored" : ""}`}
              aria-label={`Brinquedo ${t.box}`}
              aria-pressed={selected === t.id}
              disabled={isStored}
              onClick={() => tapToy(t.id)}
            >
              {!isStored && <ToyIcon kind={t.kind} color={HEX[t.box]} size={72} />}
            </button>
          );
        })}
      </div>

      <div className="boxes">
        {(["azul", "vermelho"] as BoxColor[]).map((b) => (
          <button
            key={b}
            type="button"
            className={`box box-${b} ${selected ? "ready" : ""}`}
            aria-label={`Caixa ${b}`}
            onClick={() => tapBox(b)}
          >
            <div className="box-inside">
              {toys
                .filter((t) => t.box === b && stored.includes(t.id))
                .map((t) => (
                  <ToyIcon key={t.id} kind={t.kind} color={HEX[b]} size={34} />
                ))}
            </div>
            <BoxIcon color={HEX[b]} size={130} />
          </button>
        ))}
      </div>
    </main>
  );
}
