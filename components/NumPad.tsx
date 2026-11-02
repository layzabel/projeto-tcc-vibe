"use client";

import { useEffect, useState } from "react";
import { IconBackspace } from "./Icons";

interface Props {
  title: string;
  subtitle?: string;
  /** Senha de tamanho fixo: envia automaticamente ao completar. */
  length?: number;
  /** Resposta livre (ex.: desafio): mostra botão "OK". */
  maxLength?: number;
  /** Retorna uma mensagem de erro, ou null quando deu certo. */
  onSubmit: (value: string) => string | null;
  error?: string | null;
}

/** Teclado numérico próprio para senha de 4 números e desafio dos adultos. */
export default function NumPad({ title, subtitle, length, maxLength, onSubmit, error: externalError }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const max = length ?? maxLength ?? 4;

  useEffect(() => {
    setValue("");
    setError(null);
  }, [title]);

  const submit = (v: string) => {
    const err = onSubmit(v);
    if (err) {
      setError(err);
      setShake((s) => s + 1);
      setValue("");
    }
  };

  const press = (d: string) => {
    setError(null);
    if (value.length >= max) return;
    const next = value + d;
    setValue(next);
    if (length && next.length === length) setTimeout(() => submit(next), 120);
  };

  const shown = error ?? externalError ?? null;

  return (
    <div className="numpad">
      <h2>{title}</h2>
      {subtitle && <p className="muted">{subtitle}</p>}
      {length ? (
        <div key={shake} className={`pin-dots ${shake ? "shake" : ""}`} aria-label={`${value.length} de ${length} números digitados`}>
          {Array.from({ length }, (_, i) => (
            <span key={i} className={i < value.length ? "filled" : ""} />
          ))}
        </div>
      ) : (
        <div key={shake} className={`answer-box ${shake ? "shake" : ""}`} aria-live="polite">
          {value || " "}
        </div>
      )}
      <p className="error" role="alert">
        {shown ?? " "}
      </p>
      <div className="keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className="key" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        {length ? (
          <span />
        ) : (
          <button type="button" className="key key-ok" disabled={!value} onClick={() => submit(value)}>
            OK
          </button>
        )}
        <button type="button" className="key" onClick={() => press("0")}>
          0
        </button>
        <button type="button" className="key key-del" aria-label="Apagar" onClick={() => setValue((v) => v.slice(0, -1))}>
          <IconBackspace />
        </button>
      </div>
    </div>
  );
}
