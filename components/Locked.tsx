"use client";

import { useEffect, useState } from "react";
import { useApp } from "./AppContext";
import Sky from "./Sky";
import Mascot from "./Mascot";
import Bubble from "./Bubble";
import HoldButton from "./HoldButton";
import { formatDuration, msUntilMidnight } from "@/lib/time";

/** Bloqueio até o dia seguinte. A liberação automática acontece na virada do dia (App). */
export default function Locked() {
  const { openAdult } = useApp();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Sky fraction={0} fireflies={0} moon>
      <main className="locked child-screen">
        <div className="corner">
          <HoldButton onComplete={openAdult} />
        </div>
        <div className="bubble-slot">
          <Bubble>A tela foi descansar. Até amanhã!</Bubble>
        </div>
        <Mascot mood="dormindo" size={210} />
        <p className="adult-hint">Para o adulto: a tela libera sozinha à meia-noite (em {formatDuration(msUntilMidnight(now))}).</p>
      </main>
    </Sky>
  );
}
