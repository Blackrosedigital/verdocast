// One-off fixture graphic for England v Argentina (semi-final) with drawn flags
// (St George's cross + Argentina's celeste/white bands and Sun of May). Landscape
// + square. SVG-only flags, so no emoji/asset/font dependency. Doubles as the
// "resolve frame" for the Matrix video and the static X/WhatsApp post.
//   node scripts/gen-eng-arg-og.mjs        Output: og-exports/matches/

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const BG = "#0a0b0d";
const TEXT = "#f5f3ee";
const MUTED = "#8a8d93";
const ACCENT = "#e6ff3d";
const ACCENT2 = "#ff3b6a";
const BORDER = "#2a2d33";
const GROUP_COLORS = [
  "#DC2626", "#EA580C", "#D97706", "#65A30D", "#059669", "#0891B2",
  "#2563EB", "#4F46E5", "#7C3AED", "#C026D3", "#DB2777", "#475569",
];

const LABEL = "WORLD CUP 2026 · SEMI-FINAL";
const DETAIL = "15 July · 8:00pm BST · Mercedes-Benz Stadium, Atlanta";

// England: white field, red St George's cross.
function englandFlag(x, y, w, h) {
  const t = h * 0.2; // cross arm thickness
  const red = "#CE1124";
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>
    <rect x="${x + w / 2 - t / 2}" y="${y}" width="${t}" height="${h}" fill="${red}"/>
    <rect x="${x}" y="${y + h / 2 - t / 2}" width="${w}" height="${t}" fill="${red}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${BORDER}" stroke-width="2"/>`;
}

// Sun of May: golden disc with triangular rays. Simplified (no face) for a clean
// render at small sizes; still unmistakably Argentina in the celeste/white bands.
function sunOfMay(cx, cy, r) {
  const gold = "#F4B32E";
  const n = 16;
  const inner = r;
  const outer = r * 1.9;
  const halfBase = r * 0.18;
  let rays = "";
  for (let i = 0; i < n; i++) {
    const a = ((i * (360 / n) - 90) * Math.PI) / 180;
    const tx = cx + outer * Math.cos(a);
    const ty = cy + outer * Math.sin(a);
    const bx = cx + inner * Math.cos(a);
    const by = cy + inner * Math.sin(a);
    const px = Math.cos(a + Math.PI / 2);
    const py = Math.sin(a + Math.PI / 2);
    const b1x = bx + halfBase * px;
    const b1y = by + halfBase * py;
    const b2x = bx - halfBase * px;
    const b2y = by - halfBase * py;
    rays += `<path d="M${tx.toFixed(1)},${ty.toFixed(1)} L${b1x.toFixed(1)},${b1y.toFixed(1)} L${b2x.toFixed(1)},${b2y.toFixed(1)} Z" fill="${gold}"/>`;
  }
  return `${rays}<circle cx="${cx}" cy="${cy}" r="${inner.toFixed(1)}" fill="${gold}" stroke="#C77B0A" stroke-width="1.5"/>`;
}

// Argentina: celeste / white / celeste bands, Sun of May centred in the white.
function argentinaFlag(x, y, w, h) {
  const s = h / 3;
  const celeste = "#75AADB";
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${s}" fill="${celeste}"/>
    <rect x="${x}" y="${y + s}" width="${w}" height="${s}" fill="#ffffff"/>
    <rect x="${x}" y="${y + 2 * s}" width="${w}" height="${s}" fill="${celeste}"/>
    ${sunOfMay(x + w / 2, y + h / 2, h * 0.085)}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${BORDER}" stroke-width="2"/>`;
}

const FORMATS = [
  {
    suffix: "",
    W: 1200, H: 630, flagW: 200, flagH: 134, flagTop: 170,
    leftX: 340, rightX: 860, vsX: 600, vsY: 250,
    nameY: 380, label: 24, name: 58, vs: 54, detail: 26, foot: 26,
    labelY: 95, detailY: 470, footY: 548,
  },
  {
    suffix: "-square",
    W: 1080, H: 1080, flagW: 280, flagH: 187, flagTop: 300,
    leftX: 300, rightX: 780, vsX: 540, vsY: 410,
    nameY: 560, label: 28, name: 66, vs: 64, detail: 28, foot: 30,
    labelY: 150, detailY: 760, footY: 1000,
  },
];

function svg(f) {
  const seg = f.W / GROUP_COLORS.length;
  const strip = GROUP_COLORS.map(
    (c, i) => `<rect x="${i * seg}" y="${f.H - 12}" width="${seg}" height="12" fill="${c}"/>`,
  ).join("");
  const fx = (cx) => cx - f.flagW / 2; // flag left edge for a column centre

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f.W}" height="${f.H}" viewBox="0 0 ${f.W} ${f.H}">
  <defs>
    <radialGradient id="g1" cx="12%" cy="0%" r="65%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="90%" cy="100%" r="65%">
      <stop offset="0%" stop-color="${ACCENT2}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${ACCENT2}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${f.W}" height="${f.H}" fill="${BG}"/>
  <rect width="${f.W}" height="${f.H}" fill="url(#g1)"/>
  <rect width="${f.W}" height="${f.H}" fill="url(#g2)"/>

  <text x="${f.W / 2}" y="${f.labelY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.label}" letter-spacing="6" fill="${MUTED}" font-weight="700">${LABEL}</text>

  ${englandFlag(fx(f.leftX), f.flagTop, f.flagW, f.flagH)}
  ${argentinaFlag(fx(f.rightX), f.flagTop, f.flagW, f.flagH)}

  <text x="${f.leftX}" y="${f.nameY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.name}" font-weight="800" fill="${TEXT}" letter-spacing="1">ENGLAND</text>
  <text x="${f.rightX}" y="${f.nameY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.name}" font-weight="800" fill="${TEXT}" letter-spacing="1">ARGENTINA</text>
  <text x="${f.vsX}" y="${f.vsY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.vs}" font-weight="800" fill="${ACCENT}">v</text>

  <text x="${f.W / 2}" y="${f.detailY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.detail}" fill="${MUTED}">${DETAIL}</text>
  <text x="${f.W / 2}" y="${f.footY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.foot}" font-weight="700" fill="${TEXT}">Predict it free · <tspan fill="${ACCENT}">verdocast.com</tspan></text>

  ${strip}
</svg>`;
}

const outDir = join(root, "og-exports", "matches");
mkdirSync(outDir, { recursive: true });
for (const f of FORMATS) {
  const out = join(outDir, `england-v-argentina${f.suffix}.png`);
  await sharp(Buffer.from(svg(f))).png().toFile(out);
  console.log("Wrote", out);
}
console.log("Done.");
