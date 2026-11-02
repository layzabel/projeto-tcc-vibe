import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_TICK_MS,
  addDays,
  applyElapsed,
  clampLimit,
  clampWarn,
  isExhausted,
  lastDays,
  moodFor,
  newToday,
  rollover,
  shouldWarn,
  weekSummary,
} from "../lib/time.ts";
import { createData, sanitize } from "../lib/storage.ts";
import { createPinHash, sha256Hex, verifyPin } from "../lib/pin.ts";

const MIN = 60_000;

test("limite diário fica entre 15 e 60, em passos de 5", () => {
  assert.equal(clampLimit(90), 60);
  assert.equal(clampLimit(3), 15);
  assert.equal(clampLimit(33), 35);
  assert.equal(clampLimit(Number.NaN), 60);
});

test("aviso fica entre 1 e 15 e sempre abaixo do limite", () => {
  assert.equal(clampWarn(20, 60), 15);
  assert.equal(clampWarn(15, 15), 14);
  assert.equal(clampWarn(0, 30), 1);
});

test("saltos de relógio são limitados e o uso nunca passa do limite", () => {
  let t = newToday("2026-11-02", 15);
  t = applyElapsed(t, 10 * 60 * MIN);
  assert.equal(t.usedMs, MAX_TICK_MS);
  t = applyElapsed(t, -5000);
  assert.equal(t.usedMs, MAX_TICK_MS);
  t = { ...t, usedMs: 15 * MIN - 1000 };
  t = applyElapsed(t, 2000);
  assert.equal(t.usedMs, 15 * MIN);
  assert.ok(isExhausted(t));
  assert.equal(applyElapsed(t, 1000).usedMs, 15 * MIN);
});

test("aviso de falta pouco e humor do mascote", () => {
  const data = createData(new Date(2026, 10, 2, 10), false);
  let t = newToday("2026-11-02", 60);
  assert.equal(moodFor(t, data.settings), "feliz");
  t = { ...t, usedMs: 40 * MIN };
  assert.equal(moodFor(t, data.settings), "calmo");
  assert.equal(shouldWarn(t, data.settings), false);
  t = { ...t, usedMs: 55 * MIN };
  assert.equal(shouldWarn(t, data.settings), true);
  assert.equal(moodFor(t, data.settings), "sono");
  assert.equal(shouldWarn({ ...t, warned: true }, data.settings), false);
});

test("virada do dia arquiva, zera e aplica o novo limite; relógio para trás não zera", () => {
  const data = createData(new Date(2026, 10, 2, 10), false);
  data.today = { ...data.today, usedMs: 30 * MIN, locked: true, closed: true, forceEnd: true };
  data.settings = { ...data.settings, dailyLimitMin: 30 };

  assert.equal(rollover(data, "2026-11-01"), data);
  assert.equal(rollover(data, "2026-11-02"), data);

  const next = rollover(data, "2026-11-03");
  assert.equal(next.today.date, "2026-11-03");
  assert.equal(next.today.usedMs, 0);
  assert.equal(next.today.locked, false);
  assert.equal(next.today.limitMin, 30);
  assert.deepEqual(next.history, [{ date: "2026-11-02", usedMs: 30 * MIN, limitMin: 60, closed: true }]);
});

test("histórico guarda apenas os últimos 30 dias", () => {
  const data = createData(new Date(2026, 10, 2, 10), false);
  data.history = Array.from({ length: 40 }, (_, i) => ({
    date: addDays("2026-11-02", -(40 - i)),
    usedMs: MIN,
    limitMin: 60,
    closed: false,
  }));
  const next = rollover(data, "2026-11-03");
  assert.equal(next.history.length, 30);
  assert.equal(next.history[0].date, "2026-10-04");
});

test("resumo semanal", () => {
  const data = createData(new Date(2026, 10, 2, 10), false);
  data.today.usedMs = 20 * MIN;
  data.history = [
    { date: "2026-11-01", usedMs: 40 * MIN, limitMin: 60, closed: true },
    { date: "2026-10-20", usedMs: 60 * MIN, limitMin: 60, closed: true },
  ];
  const s = weekSummary(data);
  assert.equal(s.totalMin, 60);
  assert.equal(s.daysWithUse, 2);
  assert.equal(s.averageMin, 9);
  assert.equal(lastDays(data, 7).length, 7);
});

test("dados adulterados são corrigidos ao carregar", () => {
  const now = new Date(2026, 10, 2, 10);
  const raw = createData(now, false) as any;
  raw.settings.dailyLimitMin = 240;
  raw.today.limitMin = 500;
  raw.today.usedMs = 999 * MIN;
  const d = sanitize(raw, now)!;
  assert.equal(d.settings.dailyLimitMin, 60);
  assert.equal(d.today.limitMin, 60);
  assert.equal(d.today.usedMs, 60 * MIN);
  assert.equal(sanitize({ foo: 1 }, now), null);
});

test("senha nunca é guardada legível e é verificada corretamente", () => {
  assert.equal(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  const h = createPinHash("1234", "salt");
  assert.ok(!JSON.stringify(h).includes("1234"));
  assert.ok(verifyPin("1234", h));
  assert.ok(!verifyPin("4321", h));
  assert.ok(!verifyPin("12a4", h));
});
