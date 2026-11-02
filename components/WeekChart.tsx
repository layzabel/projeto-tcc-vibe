"use client";

import { useState } from "react";
import { MAX_LIMIT, formatDate, type DayPoint } from "@/lib/time";

const W = 320;
const H = 180;
const PAD = { top: 22, right: 8, bottom: 28, left: 30 };
const BAR = "#6a57c4";

/** Barras dos últimos 7 dias, em minutos (uma série; a tabela do histórico serve de visão em texto). */
export default function WeekChart({ points }: { points: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH - (v / MAX_LIMIT) * plotH;
  const slot = plotW / points.length;
  const barW = Math.min(28, slot - 10);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Minutos de tela por dia nos últimos 7 dias">
        {[0, 15, 30, 45, 60].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#e9e6f2" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#6b6780">
              {v}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const h = Math.max(0, y(0) - y(Math.min(p.minutes, MAX_LIMIT)));
          const r = Math.min(4, h / 2, barW / 2);
          const x = cx - barW / 2;
          const top = y(0) - h;
          const isToday = i === points.length - 1;
          return (
            <g
              key={p.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
              tabIndex={0}
              aria-label={`${formatDate(p.date)}: ${p.minutes} minutos`}
            >
              <rect x={cx - slot / 2} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x} ${y(0)} V${top + r} Q${x} ${top} ${x + r} ${top} H${x + barW - r} Q${x + barW} ${top} ${x + barW} ${top + r} V${y(0)} z`}
                  fill={BAR}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {(isToday || hover === i) && (
                <text x={cx} y={top - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2b2350">
                  {p.minutes}
                </text>
              )}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="10" fill={isToday ? "#2b2350" : "#6b6780"} fontWeight={isToday ? 700 : 400}>
                {isToday ? "hoje" : formatDate(p.date, { weekday: "short" }).replace(".", "")}
              </text>
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#b9b4cc" strokeWidth="1" />
      </svg>
      <p className="chart-tip" aria-live="polite">
        {hover !== null
          ? `${formatDate(points[hover].date)}: ${points[hover].minutes} min${points[hover].recorded ? ` de ${points[hover].limitMin} min` : " (sem uso)"}`
          : "Toque numa barra para ver os detalhes."}
      </p>
    </div>
  );
}
