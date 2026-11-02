"use client";

import { useState, type ReactNode } from "react";
import { useApp, useData } from "./AppContext";
import LimitPicker from "./LimitPicker";
import NumPad from "./NumPad";
import WeekChart from "./WeekChart";
import { ConsentText } from "./Setup";
import { SbpNote, SupervisionNote } from "./Notes";
import { IconBack } from "./Icons";
import type { ClosingStyle } from "@/lib/types";
import { exportJson } from "@/lib/storage";
import { createPinHash, verifyPin } from "@/lib/pin";
import { hasLocalVoice, vibrate } from "@/lib/audio";
import {
  MAX_WARN,
  MIN_WARN,
  clampLimit,
  clampWarn,
  dateKey,
  formatDate,
  isExhausted,
  limitMs,
  minutesOf,
  remainingMs,
  toRecord,
  weekSummary,
} from "@/lib/time";

type Tab = "hoje" | "ajustes" | "registro";

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function Panel() {
  const { goChild } = useApp();
  const [tab, setTab] = useState<Tab>("hoje");

  return (
    <main className="panel page">
      <header className="adult-top">
        <button type="button" className="btn ghost small" onClick={goChild}>
          <IconBack size={20} /> Voltar para a criança
        </button>
        <strong>Painel do responsável</strong>
      </header>
      <SbpNote />
      <nav className="tabs" role="tablist">
        {(
          [
            ["hoje", "Hoje"],
            ["ajustes", "Ajustes"],
            ["registro", "Registro"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "hoje" && <TodayTab />}
      {tab === "ajustes" && <SettingsTab />}
      {tab === "registro" && <LogTab />}
    </main>
  );
}

// ---------------- Hoje ----------------

function Ring({ fraction, children }: { fraction: number; children: ReactNode }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const f = Math.min(1, Math.max(0, fraction));
  return (
    <div className="ring">
      <svg viewBox="0 0 120 120" width="170" height="170" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#ebe7fb" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={f >= 1 ? "#5b4b8a" : "#7b68c9"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${c * f} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

function TodayTab() {
  const { endNow } = useApp();
  const { today, settings } = useData();
  const [confirm, setConfirm] = useState(false);
  const usedMin = minutesOf(today.usedMs);
  const limit = clampLimit(today.limitMin);
  const exhausted = isExhausted(today);
  const state = today.locked ? "Encerrado" : exhausted ? "Encerramento em andamento" : "Em uso (liberado)";

  return (
    <section className="tab-body">
      <div className="card center">
        <Ring fraction={today.usedMs / limitMs(today)}>
          <strong>{usedMin}</strong>
          <small>de {limit} min</small>
        </Ring>
        <dl className="facts">
          <div>
            <dt>Tempo que falta</dt>
            <dd>{exhausted ? "0 min" : `${Math.ceil(remainingMs(today) / 60000)} min`}</dd>
          </div>
          <div>
            <dt>Estado do dia</dt>
            <dd>{state}</dd>
          </div>
          <div>
            <dt>Encerramento hoje</dt>
            <dd>{today.closed ? "Já aconteceu" : "Ainda não"}</dd>
          </div>
        </dl>
        {settings.dailyLimitMin !== today.limitMin && (
          <p className="note info">Novo limite de {settings.dailyLimitMin} min vale a partir de amanhã.</p>
        )}
      </div>

      <div className="card">
        <h3>Encerrar agora</h3>
        <p className="muted">O Lumi conduz o encerramento lúdico e a tela fica bloqueada até amanhã.</p>
        <button type="button" className="btn danger" disabled={exhausted} onClick={() => setConfirm(true)}>
          {today.locked ? "Tela já encerrada hoje" : exhausted ? "Encerramento em andamento" : "Encerrar agora com o Lumi"}
        </button>
      </div>

      <SupervisionNote />

      {confirm && (
        <Dialog title="Encerrar agora?" onClose={() => setConfirm(false)}>
          <p>
            O Lumi vai iniciar o encerramento e a tela ficará <strong>bloqueada até amanhã</strong>. Não é possível liberar tempo depois.
          </p>
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
              Cancelar
            </button>
            <button type="button" className="btn danger" onClick={endNow}>
              Encerrar agora
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}

// ---------------- Ajustes ----------------

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <span>
        {label}
        {hint && <small className="muted">{hint}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}

const STYLE_OPTIONS: { k: ClosingStyle; label: string; desc: string }[] = [
  { k: "respiracao", label: "Respiração", desc: "3 respirações guiadas antes do elogio." },
  { k: "historia", label: "Historinha", desc: "O Lumi conta a história da hora de descansar." },
  { k: "simples", label: "Simples", desc: "Vai direto ao elogio e à despedida." },
];

function SettingsTab() {
  const { mutate, replaceData, go } = useApp();
  const data = useData();
  const { settings } = data;
  const [name, setName] = useState(data.childName);
  const [nameSaved, setNameSaved] = useState(false);
  const [pinFlow, setPinFlow] = useState<null | "atual" | "nova" | "confirmar" | "ok">(null);
  const [newPin, setNewPin] = useState("");
  const [pinNotice, setPinNotice] = useState<string | null>(null);
  const [erase, setErase] = useState(false);

  const warnMax = Math.min(MAX_WARN, settings.dailyLimitMin - 1);
  const set = (patch: Partial<typeof settings>) => mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  const setLimit = (v: number) => {
    const l = clampLimit(v);
    // Vale a partir do dia seguinte: o limite de hoje (today.limitMin) não muda.
    set({ dailyLimitMin: l, warnMin: clampWarn(settings.warnMin, l) });
  };

  return (
    <section className="tab-body">
      <div className="card">
        <h3>Limite diário</h3>
        <LimitPicker value={settings.dailyLimitMin} onChange={setLimit} />
        <p className="note info">Alterações no limite valem a partir de amanhã. Hoje continua valendo {data.today.limitMin} min.</p>
      </div>

      <div className="card">
        <h3>Aviso antes de acabar</h3>
        <p className="muted">Um som toca e o Lumi avisa que falta pouco. Sempre menor que o limite diário.</p>
        <div className="stepper">
          <button type="button" className="btn round" aria-label="Diminuir" disabled={settings.warnMin <= MIN_WARN} onClick={() => set({ warnMin: clampWarn(settings.warnMin - 1, settings.dailyLimitMin) })}>
            −
          </button>
          <output className="stepper-value">
            {settings.warnMin} <small>min antes</small>
          </output>
          <button type="button" className="btn round" aria-label="Aumentar" disabled={settings.warnMin >= warnMax} onClick={() => set({ warnMin: clampWarn(settings.warnMin + 1, settings.dailyLimitMin) })}>
            +
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Estilo do encerramento</h3>
        <div className="options" role="radiogroup">
          {STYLE_OPTIONS.map((o) => (
            <label key={o.k} className={`option ${settings.closingStyle === o.k ? "on" : ""}`}>
              <input type="radio" name="estilo" checked={settings.closingStyle === o.k} onChange={() => set({ closingStyle: o.k })} />
              <span>
                <strong>{o.label}</strong>
                {o.k === "respiracao" && " (padrão)"}
                <small className="muted">{o.desc}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Sons, voz e animação</h3>
        <Toggle label="Sons" hint="Os avisos de “falta pouco” e de fim de tempo tocam sempre." checked={settings.sound} onChange={(v) => set({ sound: v })} />
        <Toggle
          label="Voz do Lumi"
          hint={settings.voice && !hasLocalVoice() ? "Nenhuma voz em português instalada neste aparelho foi encontrada; o Lumi fica sem voz." : "Usa somente vozes instaladas no aparelho."}
          checked={settings.voice}
          onChange={(v) => set({ voice: v })}
        />
        <Toggle label="Menos animação" checked={settings.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
      </div>

      <div className="card">
        <h3>Nome da criança</h3>
        <label className="field">
          <span>Apelido ou primeiro nome (opcional)</span>
          <input
            type="text"
            maxLength={18}
            value={name}
            autoComplete="off"
            onChange={(e) => {
              setName(e.target.value.slice(0, 18));
              setNameSaved(false);
            }}
          />
          <small className="hint">
            <strong>Não informe o nome completo.</strong> ({name.length}/18)
          </small>
        </label>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            mutate((d) => ({ ...d, childName: name.trim().slice(0, 18) }));
            setNameSaved(true);
          }}
        >
          {nameSaved ? "Salvo ✓" : "Salvar nome"}
        </button>
      </div>

      <div className="card">
        <h3>Senha</h3>
        <button type="button" className="btn ghost" onClick={() => setPinFlow("atual")}>
          Trocar a senha
        </button>
      </div>

      <div className="card">
        <h3>Dados e privacidade</h3>
        <p className="muted">
          Consentimento registrado em {new Date(data.consent.acceptedAt).toLocaleString("pt-BR")}. Todos os dados ficam apenas neste aparelho.
        </p>
        <details>
          <summary>Ler o termo de consentimento</summary>
          <ConsentText />
        </details>
        <button type="button" className="btn danger" onClick={() => setErase(true)}>
          Apagar todos os dados e recomeçar
        </button>
        <p className="muted small">Retirar o consentimento equivale a apagar todos os dados.</p>
      </div>

      {pinFlow && (
        <Dialog title="Trocar a senha" onClose={() => setPinFlow(null)}>
          {pinFlow === "atual" && (
            <NumPad
              key="atual"
              title="Senha atual"
              length={4}
              onSubmit={(pin) => {
                if (!verifyPin(pin, data.pin)) {
                  vibrate([120, 60, 120]);
                  return "Senha errada.";
                }
                setPinFlow("nova");
                return null;
              }}
            />
          )}
          {pinFlow === "nova" && (
            <NumPad
              key="nova"
              title="Nova senha"
              length={4}
              error={pinNotice}
              onSubmit={(pin) => {
                setPinNotice(null);
                setNewPin(pin);
                setPinFlow("confirmar");
                return null;
              }}
            />
          )}
          {pinFlow === "confirmar" && (
            <NumPad
              key="confirmar"
              title="Repita a nova senha"
              length={4}
              onSubmit={(pin) => {
                if (pin !== newPin) {
                  setPinNotice("As senhas não são iguais. Crie de novo.");
                  setPinFlow("nova");
                  return null;
                }
                mutate((d) => ({ ...d, pin: createPinHash(pin) }));
                setPinFlow("ok");
                return null;
              }}
            />
          )}
          {pinFlow === "ok" && <p className="note info">Senha trocada com sucesso.</p>}
          <button type="button" className="btn ghost" onClick={() => setPinFlow(null)}>
            {pinFlow === "ok" ? "Fechar" : "Cancelar"}
          </button>
        </Dialog>
      )}

      {erase && (
        <Dialog title="Apagar todos os dados?" onClose={() => setErase(false)}>
          <p>
            Isso apaga <strong>tudo</strong> deste aparelho: consentimento, nome, ajustes, senha, o tempo já usado hoje e o histórico. O Lumi
            recomeça do zero, pela configuração inicial.
          </p>
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => setErase(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                replaceData(null);
                go("setup");
              }}
            >
              Apagar tudo
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}

// ---------------- Registro ----------------

function LogTab() {
  const data = useData();
  const summary = weekSummary(data);
  const rows = [...data.history, toRecord(data.today)].sort((a, b) => b.date.localeCompare(a.date));

  const download = () => {
    const blob = new Blob([exportJson(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumi-dados-${dateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="tab-body">
      <div className="card">
        <h3>Últimos 7 dias (minutos)</h3>
        <WeekChart points={summary.points} />
      </div>

      <div className="stats">
        <div className="stat">
          <span>Média diária</span>
          <strong>{summary.averageMin} min</strong>
        </div>
        <div className="stat">
          <span>Dias com uso</span>
          <strong>{summary.daysWithUse} de 7</strong>
        </div>
        <div className="stat">
          <span>Total da semana</span>
          <strong>{summary.totalMin} min</strong>
        </div>
      </div>

      <div className="card">
        <h3>Histórico (últimos 30 dias)</h3>
        <table className="history">
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Usado</th>
              <th scope="col">Limite</th>
              <th scope="col">Encerrou</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date}>
                <td>
                  {formatDate(r.date)}
                  {r.date === data.today.date && <small className="muted"> (hoje)</small>}
                </td>
                <td>{minutesOf(r.usedMs)} min</td>
                <td>{r.limitMin} min</td>
                <td>{r.closed ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Seus dados</h3>
        <button type="button" className="btn primary" onClick={download}>
          Exportar todos os dados (arquivo .json)
        </button>
        <details>
          <summary>Ver todos os dados guardados</summary>
          <pre className="raw">{exportJson(data)}</pre>
        </details>
      </div>
    </section>
  );
}
