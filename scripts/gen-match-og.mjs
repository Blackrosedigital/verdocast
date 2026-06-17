// Generate a fixture share graphic for a single match (landscape + square).
//   node scripts/gen-match-og.mjs
// Edit MATCH below for other fixtures.

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
const GROUP_COLORS = [
  "#DC2626", "#EA580C", "#D97706", "#65A30D", "#059669", "#0891B2",
  "#2563EB", "#4F46E5", "#7C3AED", "#C026D3", "#DB2777", "#475569",
];

const MATCH = {
  slug: "england-v-croatia",
  home: "England",
  away: "Croatia",
  label: "WORLD CUP 2026 · GROUP L",
  detail: "17 June · 9:00pm BST · AT&T Stadium, Arlington",
};

const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const FORMATS = [
  {
    name: "",
    W: 1200, H: 630,
    label: 24, team: 96, vs: 44, detail: 26, foot: 26,
    labelY: 110, homeY: 270, vsY: 345, awayY: 440, detailY: 525, footY: 588,
  },
  {
    name: "-square",
    W: 1080, H: 1080,
    label: 28, team: 122, vs: 56, detail: 30, foot: 30,
    labelY: 150, homeY: 430, vsY: 540, awayY: 670, detailY: 800, footY: 1000,
  },
];

function svg(f) {
  const cx = f.W / 2;
  const seg = f.W / GROUP_COLORS.length;
  const strip = GROUP_COLORS.map(
    (c, i) => `<rect x="${i * seg}" y="${f.H - 12}" width="${seg}" height="12" fill="${c}"/>`,
  ).join("");

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

  <text x="${cx}" y="${f.labelY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.label}" letter-spacing="6" fill="${MUTED}" font-weight="700">${esc(MATCH.label)}</text>

  <text x="${cx}" y="${f.homeY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.team}" font-weight="800" fill="${TEXT}" letter-spacing="2">${esc(MATCH.home.toUpperCase())}</text>
  <text x="${cx}" y="${f.vsY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.vs}" font-weight="800" fill="${ACCENT}">v</text>
  <text x="${cx}" y="${f.awayY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.team}" font-weight="800" fill="${TEXT}" letter-spacing="2">${esc(MATCH.away.toUpperCase())}</text>

  <text x="${cx}" y="${f.detailY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.detail}" fill="${MUTED}">${esc(MATCH.detail)}</text>

  <text x="${cx}" y="${f.footY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.foot}" font-weight="700" fill="${TEXT}">Predict the score · <tspan fill="${ACCENT}">verdocast.com</tspan></text>

  ${strip}
</svg>`;
}

const outDir = join(root, "og-exports", "matches");
mkdirSync(outDir, { recursive: true });
for (const f of FORMATS) {
  const out = join(outDir, `${MATCH.slug}${f.name}.png`);
  await sharp(Buffer.from(svg(f))).png().toFile(out);
  console.log("Wrote", out);
}
console.log("Done.");
