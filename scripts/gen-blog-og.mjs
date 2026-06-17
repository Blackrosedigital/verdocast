// Generate downloadable OG/share PNGs for every blog post (1200x630), matching
// the live share cards. Output: og-exports/blog/<slug>.png
//   node scripts/gen-blog-og.mjs

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
const W = 1200;
const H = 630;

// slug -> title (kept in sync with lib/blog.tsx).
const POSTS = [
  ["world-cup-2026-prediction-league", "Turn the World Cup into your team's ritual"],
  ["world-cup-2026-schedule", "World Cup 2026 schedule: every group-stage fixture"],
  ["world-cup-2026-office-sweepstake", "World Cup 2026 office sweepstake: a free, better alternative"],
  ["world-cup-remote-team-ideas", "Best World Cup competition ideas for remote & hybrid teams"],
  ["prediction-league-scoring-explained", "How prediction league scoring works"],
  ["world-cup-2026-knockout-stage", "World Cup 2026 knockout stage: format, dates & bracket"],
  ["keep-your-league-alive-knockouts", "Keep your office league alive for the knockouts"],
  ["world-cup-2026-last-16", "World Cup 2026 last 16: how to read and predict the run-in"],
  ["world-cup-2026-quarter-finals", "World Cup 2026 quarter-finals: predictions & what to watch"],
  ["world-cup-final-predictor", "Run a World Cup final predictor for your team"],
  ["world-cup-2026-recap", "What we learned running prediction leagues at the 2026 World Cup"],
  ["prediction-league-vs-fantasy-football", "Prediction league vs. fantasy football: which is better for a team?"],
];

const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function wrap(title, maxChars) {
  const words = title.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > maxChars) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const seg = W / GROUP_COLORS.length;
const strip = GROUP_COLORS.map(
  (c, i) => `<rect x="${i * seg}" y="${H - 12}" width="${seg}" height="12" fill="${c}"/>`,
).join("");

function svgFor(title) {
  const fontSize = title.length > 52 ? 60 : title.length > 36 ? 72 : 86;
  const maxChars = Math.floor(1040 / (fontSize * 0.55));
  const lines = wrap(title, maxChars);
  const lineHeight = Math.round(fontSize * 1.12);
  const startY = 250;
  const titleTspans = lines
    .map(
      (l, i) =>
        `<tspan x="80" y="${startY + i * lineHeight}">${esc(l)}</tspan>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx="12%" cy="0%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="92%" cy="8%" r="55%">
      <stop offset="0%" stop-color="${ACCENT2}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${ACCENT2}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>

  <text x="80" y="120" font-family="Arial, Helvetica, sans-serif" font-size="22"
        letter-spacing="6" fill="${MUTED}" font-weight="700">VERDOCAST · WORLD CUP 2026</text>

  <text font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}"
        font-weight="800" fill="${TEXT}">${titleTspans}</text>

  <text x="80" y="560" font-family="Arial, Helvetica, sans-serif" font-size="28"
        fill="${MUTED}">Turn the World Cup into your team&#39;s ritual</text>

  <rect x="${W - 320}" y="528" width="240" height="48" rx="24" fill="${ACCENT}"/>
  <text x="${W - 200}" y="560" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="24" font-weight="800" fill="#0a0b0d">verdocast.com</text>

  ${strip}
</svg>`;
}

const outDir = join(root, "og-exports", "blog");
mkdirSync(outDir, { recursive: true });

for (const [slug, title] of POSTS) {
  const out = join(outDir, `${slug}.png`);
  await sharp(Buffer.from(svgFor(title))).png().toFile(out);
  console.log("Wrote", out);
}
console.log(`\nDone - ${POSTS.length} images in ${outDir}`);
