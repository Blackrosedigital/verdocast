// Generate downloadable share images for every blog post, matching the live
// share cards. Outputs two formats:
//   og-exports/blog/<slug>.png          1200x630 (link previews / OG)
//   og-exports/blog/square/<slug>.png   1080x1080 (Instagram / LinkedIn carousels)
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

// Per-format layout. Landscape (OG) and square (social).
const FORMATS = {
  og: {
    dir: "blog",
    W: 1200, H: 630, pad: 80,
    labelY: 120, titleCenterY: 300, taglineY: 560,
    label: 22, tagline: 28, chip: 24, chipW: 240, chipH: 48, chipY: 528,
    fonts: [60, 72, 86], maxWidth: 1040,
  },
  square: {
    dir: "blog/square",
    W: 1080, H: 1080, pad: 90,
    labelY: 150, titleCenterY: 520, taglineY: 950,
    label: 26, tagline: 30, chip: 26, chipW: 270, chipH: 54, chipY: 922,
    fonts: [78, 94, 110], maxWidth: 900,
  },
};

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

function buildSvg(title, f) {
  const fontSize =
    title.length > 52 ? f.fonts[0] : title.length > 36 ? f.fonts[1] : f.fonts[2];
  const maxChars = Math.floor(f.maxWidth / (fontSize * 0.55));
  const lines = wrap(title, maxChars);
  const lineHeight = Math.round(fontSize * 1.12);
  const firstBaseline =
    f.titleCenterY - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.34;
  const titleTspans = lines
    .map(
      (l, i) =>
        `<tspan x="${f.pad}" y="${Math.round(firstBaseline + i * lineHeight)}">${esc(l)}</tspan>`,
    )
    .join("");

  const seg = f.W / GROUP_COLORS.length;
  const strip = GROUP_COLORS.map(
    (c, i) => `<rect x="${i * seg}" y="${f.H - 12}" width="${seg}" height="12" fill="${c}"/>`,
  ).join("");

  const chipX = f.W - f.pad - f.chipW;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f.W}" height="${f.H}" viewBox="0 0 ${f.W} ${f.H}">
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
  <rect width="${f.W}" height="${f.H}" fill="${BG}"/>
  <rect width="${f.W}" height="${f.H}" fill="url(#g1)"/>
  <rect width="${f.W}" height="${f.H}" fill="url(#g2)"/>

  <text x="${f.pad}" y="${f.labelY}" font-family="Arial, Helvetica, sans-serif" font-size="${f.label}"
        letter-spacing="6" fill="${MUTED}" font-weight="700">VERDOCAST · WORLD CUP 2026</text>

  <text font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}"
        font-weight="800" fill="${TEXT}">${titleTspans}</text>

  <text x="${f.pad}" y="${f.taglineY}" font-family="Arial, Helvetica, sans-serif" font-size="${f.tagline}"
        fill="${MUTED}">Turn the World Cup into your team&#39;s ritual</text>

  <rect x="${chipX}" y="${f.chipY}" width="${f.chipW}" height="${f.chipH}" rx="${f.chipH / 2}" fill="${ACCENT}"/>
  <text x="${chipX + f.chipW / 2}" y="${f.chipY + f.chipH / 2 + f.chip / 3}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${f.chip}" font-weight="800" fill="#0a0b0d">verdocast.com</text>

  ${strip}
</svg>`;
}

for (const f of Object.values(FORMATS)) {
  const outDir = join(root, "og-exports", ...f.dir.split("/"));
  mkdirSync(outDir, { recursive: true });
  for (const [slug, title] of POSTS) {
    const out = join(outDir, `${slug}.png`);
    await sharp(Buffer.from(buildSvg(title, f))).png().toFile(out);
  }
  console.log(`Wrote ${POSTS.length} ${f.W}x${f.H} images to ${outDir}`);
}
console.log("Done.");
