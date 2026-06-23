// One-off fixture graphic for England v Ghana with drawn flags (St George's
// cross + Ghana's red/gold/green star). Landscape + square. SVG-only flags so
// there's no emoji/asset/font dependency. Output: og-exports/matches/
//   node scripts/gen-eng-gha-og.mjs

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

const LABEL = "WORLD CUP 2026 · GROUP L";
const DETAIL = "23 June · 9:00pm BST · Gillette Stadium, Foxborough";

// Five-pointed star path centred at (cx,cy), point up.
function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const ao = ((-90 + i * 72) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(ao), cy + r * Math.sin(ao)]);
    const ai = ((-90 + i * 72 + 36) * Math.PI) / 180;
    const ri = r * 0.382;
    pts.push([cx + ri * Math.cos(ai), cy + ri * Math.sin(ai)]);
  }
  return (
    "M" +
    pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" L") +
    " Z"
  );
}

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

// Ghana: red / gold / green stripes, black star in the gold band.
function ghanaFlag(x, y, w, h) {
  const s = h / 3;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${s}" fill="#CE1126"/>
    <rect x="${x}" y="${y + s}" width="${w}" height="${s}" fill="#FCD116"/>
    <rect x="${x}" y="${y + 2 * s}" width="${w}" height="${s}" fill="#006B3F"/>
    <path d="${star(x + w / 2, y + h / 2, h * 0.14)}" fill="#000000"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${BORDER}" stroke-width="2"/>`;
}

const FORMATS = [
  {
    suffix: "",
    W: 1200, H: 630, flagW: 200, flagH: 134, flagTop: 170,
    leftX: 340, rightX: 860, vsX: 600, vsY: 250,
    nameY: 380, label: 24, name: 62, vs: 54, detail: 26, foot: 26,
    labelY: 95, detailY: 470, footY: 548,
  },
  {
    suffix: "-square",
    W: 1080, H: 1080, flagW: 280, flagH: 187, flagTop: 300,
    leftX: 300, rightX: 780, vsX: 540, vsY: 410,
    nameY: 560, label: 28, name: 72, vs: 64, detail: 28, foot: 30,
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
  ${ghanaFlag(fx(f.rightX), f.flagTop, f.flagW, f.flagH)}

  <text x="${f.leftX}" y="${f.nameY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.name}" font-weight="800" fill="${TEXT}" letter-spacing="1">ENGLAND</text>
  <text x="${f.rightX}" y="${f.nameY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.name}" font-weight="800" fill="${TEXT}" letter-spacing="1">GHANA</text>
  <text x="${f.vsX}" y="${f.vsY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.vs}" font-weight="800" fill="${ACCENT}">v</text>

  <text x="${f.W / 2}" y="${f.detailY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.detail}" fill="${MUTED}">${DETAIL}</text>
  <text x="${f.W / 2}" y="${f.footY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.foot}" font-weight="700" fill="${TEXT}">Predict the score · <tspan fill="${ACCENT}">verdocast.com</tspan></text>

  ${strip}
</svg>`;
}

const outDir = join(root, "og-exports", "matches");
mkdirSync(outDir, { recursive: true });
for (const f of FORMATS) {
  const out = join(outDir, `england-v-ghana${f.suffix}.png`);
  await sharp(Buffer.from(svg(f))).png().toFile(out);
  console.log("Wrote", out);
}
console.log("Done.");
