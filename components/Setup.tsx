"use client";

import { useState } from "react";
import { useApp } from "./AppContext";
import Mascot from "./Mascot";
import NumPad from "./NumPad";
import LimitPicker from "./LimitPicker";
import { SbpNote, SupervisionNote } from "./Notes";
import { createData } from "@/lib/storage";
import { createPinHash } from "@/lib/pin";
import { DEFAULT_LIMIT, clampLimit, clampWarn } from "@/lib/time";

type Step = "boasvindas" | "consentimento" | "nome" | "limite" | "senha" | "confirmar" | "pronto";

const ORDER: Step[] = ["boasvindas", "consentimento", "nome", "limite", "senha", "confirmar", "pronto"];

export function ConsentText() {
  return (
    <div className="consent-text">
      <p>
        <strong>Quais dados são guardados:</strong> o registro deste consentimento; o apelido ou primeiro nome da criança (opcional); os
        ajustes do aplicativo; a senha de 4 números (somente em forma cifrada, nunca legível); o tempo de tela usado hoje; e o histórico dos
        últimos 30 dias (total usado, limite do dia e se houve encerramento).
      </p>
      <p>
        <strong>Para quê:</strong> apenas para contar e limitar o tempo de tela da criança dentro deste aplicativo e mostrar o
        acompanhamento a você.
      </p>
      <p>
        <strong>Onde ficam:</strong> somente neste aparelho. Nada é enviado a servidores, empresas ou terceiros. Não há conta, login,
        anúncios ou compras.
      </p>
      <p>
        <strong>Seus direitos:</strong> você pode ver, exportar e apagar todos os dados a qualquer momento no painel do responsável.
        Retirar o consentimento apaga todos os dados. Dados com mais de 30 dias são apagados automaticamente.
      </p>
    </div>
  );
}

export default function Setup() {
  const { data, replaceData, mutate, goChild } = useApp();
  const [step, setStep] = useState<Step>(data ? "nome" : "boasvindas");
  const [agree, setAgree] = useState(false);
  const [refused, setRefused] = useState(false);
  const [name, setName] = useState(data?.childName ?? "");
  const [limit, setLimit] = useState(data?.settings.dailyLimitMin ?? DEFAULT_LIMIT);
  const [firstPin, setFirstPin] = useState("");

  const index = ORDER.indexOf(step);

  const acceptConsent = () => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    replaceData(createData(new Date(), !!reduced));
    setStep("nome");
  };

  const saveName = () => {
    mutate((d) => ({ ...d, childName: name.trim().slice(0, 18) }));
    setStep("limite");
  };

  const saveLimit = () => {
    const l = clampLimit(limit);
    // Na configuração inicial o limite escolhido já vale para hoje.
    mutate((d) => ({
      ...d,
      settings: { ...d.settings, dailyLimitMin: l, warnMin: clampWarn(d.settings.warnMin, l) },
      today: { ...d.today, limitMin: l },
    }));
    setStep("senha");
  };

  return (
    <main className="setup page">
      <div className="setup-progress" aria-label={`Passo ${index + 1} de ${ORDER.length}`}>
        {ORDER.map((s, i) => (
          <span key={s} className={i <= index ? "on" : ""} />
        ))}
      </div>

      {step === "boasvindas" && (
        <section className="card center">
          <Mascot mood="feliz" size={150} />
          <h1>Olá! Eu sou o Lumi.</h1>
          <p>
            O Lumi ajuda crianças de 2 a 5 anos a entender, de forma lúdica e previsível, quando o tempo de tela acaba. E dá a você,
            responsável, controle e acompanhamento desse tempo.
          </p>
          <SbpNote />
          <p className="muted">O tempo é contado apenas dentro do Lumi, enquanto a criança usa as atividades dele.</p>
          <button className="btn primary big" onClick={() => setStep("consentimento")}>
            Começar
          </button>
        </section>
      )}

      {step === "consentimento" && (
        <section className="card">
          <h1>Consentimento do responsável</h1>
          <div className="consent-box" role="region" aria-label="Termo de consentimento">
            <p className="consent-lead">
              Antes de qualquer dado ser coletado, precisamos do consentimento de um dos pais ou do responsável legal pela criança.
            </p>
            <ConsentText />
          </div>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>Sou pai, mãe ou responsável legal pela criança e concordo com o tratamento desses dados, guardados somente neste aparelho.</span>
          </label>
          {refused && !agree && (
            <p className="error" role="alert">
              Sem o consentimento não é possível configurar nem usar o Lumi. Nenhum dado foi guardado.
            </p>
          )}
          <div className="row">
            <button className="btn ghost" onClick={() => {
                setAgree(false);
                setRefused(true);
              }}>
              Não concordo
            </button>
            <button className="btn primary" disabled={!agree} onClick={acceptConsent}>
              Concordo e continuar
            </button>
          </div>
        </section>
      )}

      {step === "nome" && (
        <section className="card">
          <h1>Como chamamos a criança?</h1>
          <p>O Lumi vai cumprimentar a criança por esse nome. É opcional.</p>
          <label className="field">
            <span>Apelido ou primeiro nome</span>
            <input
              type="text"
              value={name}
              maxLength={18}
              autoComplete="off"
              placeholder="Ex.: Bia"
              onChange={(e) => setName(e.target.value.slice(0, 18))}
            />
            <small className="hint">
              Use só um apelido ou o primeiro nome. <strong>Não informe o nome completo.</strong> ({name.length}/18)
            </small>
          </label>
          <div className="row">
            <button className="btn ghost" onClick={() => { setName(""); mutate((d) => ({ ...d, childName: "" })); setStep("limite"); }}>
              Pular
            </button>
            <button className="btn primary" onClick={saveName}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {step === "limite" && (
        <section className="card">
          <h1>Tempo de tela por dia</h1>
          <LimitPicker value={limit} onChange={setLimit} />
          <SbpNote />
          <button className="btn primary big" onClick={saveLimit}>
            Continuar
          </button>
        </section>
      )}

      {step === "senha" && (
        <section className="card">
          <NumPad
            key="nova"
            title="Crie uma senha de 4 números"
            subtitle="Ela protege a área dos adultos contra o acesso da criança."
            length={4}
            onSubmit={(pin) => {
              setFirstPin(pin);
              setStep("confirmar");
              return null;
            }}
          />
        </section>
      )}

      {step === "confirmar" && (
        <section className="card">
          <NumPad
            key="confirmar"
            title="Repita a senha"
            subtitle="Digite os mesmos 4 números para confirmar."
            length={4}
            onSubmit={(pin) => {
              if (pin !== firstPin) return "As senhas não são iguais. Tente de novo.";
              mutate((d) => ({ ...d, pin: createPinHash(pin) }));
              setFirstPin("");
              setStep("pronto");
              return null;
            }}
          />
          <button className="btn link" onClick={() => { setFirstPin(""); setStep("senha"); }}>
            Escolher outra senha
          </button>
        </section>
      )}

      {step === "pronto" && (
        <section className="card center">
          <Mascot mood="festa" size={140} />
          <h1>Tudo pronto!</h1>
          <SupervisionNote />
          <p className="muted">
            Para entrar na área dos adultos, segure o botão <strong>Sou o adulto</strong> no canto da tela por 3 segundos e digite a senha.
          </p>
          <button
            className="btn primary big"
            onClick={() => {
              mutate((d) => ({ ...d, setupDone: true }));
              goChild();
            }}
          >
            Ir para o mundo da criança
          </button>
        </section>
      )}
    </main>
  );
}
