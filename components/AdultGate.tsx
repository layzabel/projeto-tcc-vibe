"use client";

import { useState } from "react";
import { useApp } from "./AppContext";
import NumPad from "./NumPad";
import { IconBack } from "./Icons";
import { createPinHash, verifyPin } from "@/lib/pin";
import { vibrate } from "@/lib/audio";

type Step = "senha" | "desafio" | "nova" | "confirmar";

function newChallenge(): [number, number] {
  const r = () => 20 + Math.floor(Math.random() * 30); // 20 a 49
  return [r(), r()];
}

/** Acesso à área dos adultos: senha de 4 números, com recuperação por desafio. */
export default function AdultGate() {
  const { data, mutate, go, goChild } = useApp();
  const [step, setStep] = useState<Step>("senha");
  const [challenge, setChallenge] = useState<[number, number]>(newChallenge);
  const [firstPin, setFirstPin] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <main className="gate page">
      <header className="adult-top">
        <button type="button" className="btn ghost small" onClick={goChild}>
          <IconBack size={20} /> Voltar
        </button>
        <strong>Área dos adultos</strong>
      </header>

      <section className="card">
        {step === "senha" && (
          <>
            <NumPad
              key="senha"
              title="Digite a senha"
              subtitle="Senha de 4 números do responsável."
              length={4}
              onSubmit={(pin) => {
                if (verifyPin(pin, data?.pin ?? null)) {
                  go("panel");
                  return null;
                }
                vibrate([120, 60, 120]);
                return "Senha errada. Tente de novo.";
              }}
            />
            <button
              type="button"
              className="btn link"
              onClick={() => {
                setChallenge(newChallenge());
                setStep("desafio");
              }}
            >
              Esqueci a senha
            </button>
          </>
        )}

        {step === "desafio" && (
          <>
            <NumPad
              key={`desafio-${challenge.join("+")}`}
              title={`Quanto é ${challenge[0]} + ${challenge[1]}?`}
              subtitle="Desafio para adultos. Resolva para criar uma nova senha."
              maxLength={3}
              onSubmit={(v) => {
                if (Number(v) === challenge[0] + challenge[1]) {
                  setStep("nova");
                  return null;
                }
                vibrate(150);
                setChallenge(newChallenge());
                return "Resposta errada. Tente esta nova conta.";
              }}
            />
            <button type="button" className="btn link" onClick={() => setStep("senha")}>
              Lembrei a senha
            </button>
          </>
        )}

        {step === "nova" && (
          <NumPad
            key="nova"
            title="Crie uma nova senha"
            subtitle="4 números."
            length={4}
            error={notice}
            onSubmit={(pin) => {
              setNotice(null);
              setFirstPin(pin);
              setStep("confirmar");
              return null;
            }}
          />
        )}

        {step === "confirmar" && (
          <NumPad
            key="confirmar"
            title="Repita a nova senha"
            length={4}
            onSubmit={(pin) => {
              if (pin !== firstPin) {
                setFirstPin("");
                setStep("nova");
                vibrate(150);
                setNotice("As senhas não são iguais. Crie de novo.");
                return null;
              }
              mutate((d) => ({ ...d, pin: createPinHash(pin) }));
              go("panel");
              return null;
            }}
          />
        )}
      </section>
    </main>
  );
}
