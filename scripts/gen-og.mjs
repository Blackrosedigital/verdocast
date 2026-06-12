// Generate the social share image at public/og-image.png (1200x630) from a
// brand SVG, rasterised with sharp. Re-run after brand changes:
//   node scripts/gen-og.mjs

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Verdocast brand tokens.
const BG = "#0a0b0d";
const TEXT = "#f5f3ee";
const MUTED = "#8a8d93";
const ACCENT = "#e6ff3d";
const ACCENT2 = "#ff3b6a";
const GROUP_COLORS = [
  "#DC2626", "#EA580C", "#D97706", "#65A30D", "#059669", "#0891B2",
  "#2563EB", "#4F46E5", "#7C3AED", "#C026D3", "#DB2777", "#475569",
];

const W = 1200;
const H = 630;
const stripH = 12;
const seg = W / GROUP_COLORS.length;

const strip = GROUP_COLORS.map(
  (c, i) => `<rect x="${i * seg}" y="${H - stripH}" width="${seg}" height="${stripH}" fill="${c}"/>`,
).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx="15%" cy="0%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="90%" cy="10%" r="55%">
      <stop offset="0%" stop-color="${ACCENT2}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${ACCENT2}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>

  <text x="80" y="150" font-family="Arial, Helvetica, sans-serif" font-size="22"
        letter-spacing="6" fill="${MUTED}" font-weight="700">FIFA WORLD CUP 2026</text>

  <text x="76" y="320" font-family="Arial, Helvetica, sans-serif" font-size="150"
        font-weight="800" letter-spacing="2">
    <tspan fill="${TEXT}">VERDO</tspan><tspan fill="${ACCENT}">CAST</tspan>
  </text>

  <text x="80" y="400" font-family="Arial, Helvetica, sans-serif" font-size="44"
        fill="${TEXT}" font-weight="600">Forecast every match. Settle every debate.</text>

  <text x="80" y="460" font-family="Arial, Helvetica, sans-serif" font-size="30"
        fill="${MUTED}">Free office predictor league - set up in 2 minutes.</text>

  <rect x="80" y="510" width="430" height="56" rx="28" fill="${ACCENT}"/>
  <text x="295" y="548" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="26" font-weight="800" fill="#0a0b0d">FREE FOR THE GROUP STAGE</text>

  <text x="${W - 80}" y="548" text-anchor="end" font-family="Arial, Helvetica, sans-serif"
        font-size="30" font-weight="700" fill="${TEXT}">verdocast.com</text>

  ${strip}
</svg>`;

mkdirSync(join(root, "public"), { recursive: true });
const out = join(root, "public", "og-image.png");
await sharp(Buffer.from(svg)).png().toFile(out);
console.log("Wrote", out);
