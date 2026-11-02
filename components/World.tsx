"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp, useData } from "./AppContext";
import Sky from "./Sky";
import Mascot from "./Mascot";
import Bubble from "./Bubble";
import HoldButton from "./HoldButton";
import { IconBook, IconFamily, IconHeart, IconPlay } from "./Icons";
import { AFFECTION, INVITE, WARNING, greeting, pick } from "@/lib/phrases";
import { moodFor, remainingFraction, remainingMs } from "@/lib/time";
import type { Mood } from "@/lib/types";

/** Mundo da criança: mascote, céu que mostra o tempo e três botões grandes. */
export default function World() {
  const { mutate, go, openAdult, sound, say, warnFlash } = useApp();
  const data = useData();
  const { today, settings, childName } = data;
  const [bubble, setBubble] = useState<{ text: string; icon?: ReactNode } | null>(null);
  const [party, setParty] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const hello = greeting(childName);
    if (!today.invited) {
      // Uma vez por dia: convite para chamar um adulto.
      mutate((d) => ({ ...d, today: { ...d.today, invited: true } }));
      setBubble({ text: `${hello} ${INVITE}`, icon: <IconFamily size={40} /> });
      say(`${hello} ${INVITE}`);
    } else {
      setBubble({ text: hello });
      say(hello);
    }
    later(() => setBubble(null), 7000);
    const list = timers.current;
    return () => list.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (warnFlash) setBubble({ text: WARNING });
  }, [warnFlash]);

  const tapMascot = () => {
    const text = pick(AFFECTION);
    sound("brilho");
    say(text);
    setBubble({ text, icon: <IconHeart size={28} /> });
    setParty(true);
    later(() => setParty(false), 1600);
    later(() => setBubble((b) => (b?.text === text ? null : b)), 5000);
  };

  const baseMood = moodFor(today, settings);
  const mood: Mood = party && baseMood !== "sono" ? "festa" : baseMood;
  const remaining = remainingMs(today);

  return (
    <Sky fraction={remainingFraction(today)}>
      <main className="world child-screen">
        <div className="corner">
          <HoldButton onComplete={openAdult} />
        </div>

        <div className="world-stage">
          <div className="bubble-slot">{bubble && <Bubble icon={bubble.icon}>{bubble.text}</Bubble>}</div>
          <button type="button" className="mascot-btn" aria-label="Lumi" onClick={tapMascot}>
            <Mascot mood={mood} size={190} />
          </button>
        </div>

        <nav className="big-buttons" aria-label="Atividades">
          <button type="button" className="big-btn play" onClick={() => { sound("toque"); go("game"); }}>
            <IconPlay size={64} />
            <span>Brincar</span>
          </button>
          <button type="button" className="big-btn story" onClick={() => { sound("toque"); go("story"); }}>
            <IconBook size={64} />
            <span>História</span>
          </button>
          <button type="button" className="big-btn friend" onClick={tapMascot}>
            <IconHeart size={64} />
            <span>Lumi</span>
          </button>
        </nav>

        {today.warned && remaining > 0 && (
          <p className="adult-hint">Para o adulto: faltam cerca de {Math.max(1, Math.ceil(remaining / 60000))} min.</p>
        )}
      </main>
    </Sky>
  );
}
