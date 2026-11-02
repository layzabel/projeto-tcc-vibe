// Gera os ícones PNG do app (sem dependências). Uso: node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5, size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const cover = (d, aa) => Math.min(1, Math.max(0, 0.5 - d / aa));

function draw(scale, rounded) {
  return (px, py, size) => {
    const aa = 1.2 / size;
    const x = px / size - 0.5;
    const y = py / size - 0.5;
    let col = [43, 35, 80];
    let alpha = 1;
    if (rounded) {
      const r = 0.22;
      const qx = Math.abs(x) - (0.5 - r);
      const qy = Math.abs(y) - (0.5 - r);
      const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      alpha = cover(d, aa);
    }
    const s = scale;
    // brilho
    const gd = Math.hypot(x, y - 0.12 * s) / (0.42 * s);
    col = mix(col, [255, 225, 77], Math.max(0, 1 - gd) ** 2 * 0.55);
    // barriga luminosa
    const bd = Math.hypot(x / 0.2, (y - 0.15 * s) / 0.19) - s;
    col = mix(col, [255, 220, 80], cover(bd * 0.2, aa));
    // cabeça
    const hd = Math.hypot(x, y + 0.1 * s) - 0.24 * s;
    col = mix(col, [123, 104, 201], cover(hd, aa));
    // olhos
    for (const ex of [-0.085, 0.085]) {
      const ed = Math.hypot(x - ex * s, y + 0.13 * s) - 0.045 * s;
      col = mix(col, [43, 35, 80], cover(ed, aa));
      const hl = Math.hypot(x - (ex + 0.018) * s, y + 0.15 * s) - 0.014 * s;
      col = mix(col, [255, 255, 255], cover(hl, aa));
    }
    // sorriso
    const sd = Math.abs(Math.hypot(x, y + 0.08 * s) - 0.08 * s) - 0.014 * s;
    if (y > -0.06 * s) col = mix(col, [43, 35, 80], cover(sd, aa));
    return [...col.map(Math.round), Math.round(alpha * 255)];
  };
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", png(192, draw(1, true)));
writeFileSync("public/icons/icon-512.png", png(512, draw(1, true)));
writeFileSync("public/icons/icon-maskable-512.png", png(512, draw(0.72, false)));
writeFileSync("public/icons/apple-touch-icon.png", png(180, draw(0.9, false)));
writeFileSync(
  "public/icons/icon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><radialGradient id="g" cx="50%" cy="62%" r="45%"><stop offset="0" stop-color="#ffe14d" stop-opacity=".7"/><stop offset="1" stop-color="#ffe14d" stop-opacity="0"/></radialGradient></defs>
  <rect width="100" height="100" rx="22" fill="#2b2350"/>
  <circle cx="50" cy="62" r="42" fill="url(#g)"/>
  <ellipse cx="50" cy="65" rx="20" ry="19" fill="#ffdc50"/>
  <circle cx="50" cy="40" r="24" fill="#7b68c9"/>
  <circle cx="41.5" cy="37" r="4.5" fill="#2b2350"/><circle cx="58.5" cy="37" r="4.5" fill="#2b2350"/>
  <path d="M43 46 q7 7 14 0" stroke="#2b2350" stroke-width="2.8" fill="none" stroke-linecap="round"/>
</svg>
`,
);
console.log("Ícones gerados em public/icons");
