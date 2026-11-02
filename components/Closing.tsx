"use client";

import { useEffect, useRef, useState } from "react";
import { useApp, useData } from "./AppContext";
import Sky from "./Sky";
import Mascot from "./Mascot";
import Bubble from "./Bubble";
import HoldButton from "./HoldButton";
import Story from "./Story";
import { ActivityIcon } from "./Icons";
import { playSound, stopSpeech } from "@/lib/audio";
import { BYE, CHOOSE, CHOSEN, praise, timeUp } from "@/lib/phrases";
import type { Mood } from "@/lib/types";

type Step = "aviso" | "respiracao" | "historia" | "elogio" | "escolha" | "tchau";

const ACTIVITIES = [
  { k: "brinquedo", label: "Brincar com um brinquedo" },
  { k: "desenhar", label: "Desenhar" },
  { k: "abraco", label: "Dar um abraço em quem cuida de você" },
  { k: "livro", label: "Ver um livro" },
] as const;

const BREATHS = 3;
const IN_MS = 4000;
const OUT_MS = 4000;
const BREATH_INTRO_MS = 3000;
/** Se ninguém escolher uma atividade, a despedida acontece mesmo assim. */
const CHOICE_TIMEOUT_MS = 90_000;

/**
 * Encerramento lúdico. Cada execução é um componente novo (key no App):
 * ao reiniciar, todos os temporizadores e falas da execução anterior são cancelados.
 */
export default function Closing() {
  const { finishClosing, openAdult, sound, say } = useApp();
  const { settings, childName } = useData();
  const [step, setStep] = useState<Step>("aviso");
  const [breath, setBreath] = useState<{ n: number; phase: "in" | "out" | null }>({ n: 0, phase: null });
  const [resting, setResting] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const alive = useRef(true);
  const style = useRef(settings.closingStyle).current;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(
        setTimeout(() => {
          if (alive.current) fn();
        }, ms),
      );

    switch (step) {
      case "aviso":
        playSound("fim", true); // toca sempre, mesmo com sons desligados
        at(1600, () => say(timeUp(childName)));
        at(6500, () => setStep(style === "respiracao" ? "respiracao" : style === "historia" ? "historia" : "elogio"));
        break;
      case "respiracao": {
        say("Vamos respirar juntos, bem devagar.");
        for (let i = 0; i < BREATHS; i++) {
          const t = BREATH_INTRO_MS + i * (IN_MS + OUT_MS);
          at(t, () => {
            setBreath({ n: i + 1, phase: "in" });
            say("Inspira...");
          });
          at(t + IN_MS, () => {
            setBreath({ n: i + 1, phase: "out" });
            say("Solta...");
          });
        }
        at(BREATH_INTRO_MS + BREATHS * (IN_MS + OUT_MS) + 600, () => setStep("elogio"));
        break;
      }
      case "elogio":
        sound("festa");
        say(praise(childName));
        at(3500, () => setResting(true));
        at(7500, () => setStep("escolha"));
        break;
      case "escolha":
        if (choice) {
          const a = ACTIVITIES.find((x) => x.k === choice);
          sound("acerto");
          say(`${CHOSEN} ${a?.label ?? ""}!`);
          at(3500, () => setStep("tchau"));
        } else {
          say(CHOOSE);
          at(CHOICE_TIMEOUT_MS, () => setStep("tchau"));
        }
        break;
      case "tchau":
        sound("tchau");
        say(BYE);
        at(5500, finishClosing);
        break;
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, choice]);

  const corner = (
    <div className="corner fixed">
      <HoldButton onComplete={openAdult} />
    </div>
  );

  if (step === "historia") {
    return (
      <>
        <Story mode="encerramento" onFinish={() => alive.current && setStep("elogio")} />
        {corner}
      </>
    );
  }

  let mood: Mood = "sono";
  let text = "";
  if (step === "aviso") text = timeUp(childName);
  if (step === "respiracao") {
    mood = "calmo";
    text = breath.phase === "in" ? "Inspira..." : breath.phase === "out" ? "Solta..." : "Vamos respirar juntos, bem devagar.";
  }
  if (step === "elogio") {
    mood = resting ? "sono" : "festa";
    text = praise(childName);
  }
  if (step === "escolha") text = choice ? CHOSEN : CHOOSE;
  if (step === "tchau") {
    mood = "dormindo";
    text = BYE;
  }

  return (
    <Sky fraction={step === "tchau" ? 0 : 0.18} fireflies={0} moon={step === "tchau"}>
      <main className={`closing child-screen step-${step}`}>
        {corner}
        <div className="bubble-slot">
          <Bubble>{text}</Bubble>
        </div>

        {step === "respiracao" ? (
          <div className="breath-stage">
            <div className={`breath-circle ${breath.phase ?? ""}`} aria-hidden="true">
              <Mascot mood={mood} size={130} />
            </div>
            <div className="breath-count" aria-label={`Respiração ${breath.n} de ${BREATHS}`}>
              {Array.from({ length: BREATHS }, (_, i) => (
                <span key={i} className={i < breath.n ? "on" : ""} />
              ))}
            </div>
          </div>
        ) : step === "escolha" ? (
          <>
            <Mascot mood={mood} size={100} />
            <div className="activities" role="group" aria-label="Escolha uma atividade">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.k}
                  type="button"
                  className={`activity ${choice === a.k ? "chosen" : ""} ${choice && choice !== a.k ? "faded" : ""}`}
                  aria-label={a.label}
                  disabled={!!choice}
                  onClick={() => setChoice(a.k)}
                >
                  <ActivityIcon kind={a.k} size={76} />
                  <small>{a.label}</small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <Mascot mood={mood} size={200} />
        )}
      </main>
    </Sky>
  );
}
