// Generate fixture share graphics for the Round of 32, reading RESOLVED teams
// from the database (knockout teams are null in the static JSON until the
// bracket fills in). Renders the text fixture card (landscape + square) for each
// R32 tie that has both teams. Output: og-exports/matches/r32/
//   node scripts/gen-r32-og.mjs            (defaults to stage r32)
//   node scripts/gen-r32-og.mjs r16        (any knockout stage)

import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Load .env.local (CRLF-safe) for the Supabase anon key (matches are public-read).
for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, "");
}

const STAGE = process.argv[2] ?? "r32";
const STAGE_LABEL = {
  r32: "ROUND OF 32",
  r16: "ROUND OF 16",
  qf: "QUARTER-FINAL",
  sf: "SEMI-FINAL",
  third: "THIRD PLACE",
  final: "FINAL",
};

const BG = "#0a0b0d";
const TEXT = "#f5f3ee";
const MUTED = "#8a8d93";
const ACCENT = "#e6ff3d";
const ACCENT2 = "#ff3b6a";
const GROUP_COLORS = [
  "#DC2626", "#EA580C", "#D97706", "#65A30D", "#059669", "#0891B2",
  "#2563EB", "#4F46E5", "#7C3AED", "#C026D3", "#DB2777", "#475569",
];

const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function detailLine(m) {
  const d = new Date(m.kickoff_utc);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/London",
  });
  const time = d
    .toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Europe/London",
    })
    .replace(/\s/g, "")
    .toLowerCase();
  const place = [m.venue, m.venue_city].filter(Boolean).join(", ");
  return `${date} · ${time} BST${place ? ` · ${place}` : ""}`;
}

const FORMATS = [
  {
    suffix: "",
    W: 1200, H: 630,
    label: 24, team: 90, vs: 44, detail: 26, foot: 26,
    labelY: 110, homeY: 270, vsY: 345, awayY: 440, detailY: 525, footY: 588,
  },
  {
    suffix: "-square",
    W: 1080, H: 1080,
    label: 28, team: 112, vs: 56, detail: 28, foot: 30,
    labelY: 150, homeY: 430, vsY: 540, awayY: 670, detailY: 800, footY: 1000,
  },
];

// Shrink the team font for long names so they never overflow the canvas.
function teamFont(name, f) {
  const maxW = f.W - 160; // side padding
  const est = Math.floor(maxW / (name.length * 0.64));
  return Math.min(f.team, est);
}

function svg(m, f) {
  const cx = f.W / 2;
  const homeFont = teamFont(m.home_team, f);
  const awayFont = teamFont(m.away_team, f);
  const seg = f.W / GROUP_COLORS.length;
  const strip = GROUP_COLORS.map(
    (c, i) => `<rect x="${i * seg}" y="${f.H - 12}" width="${seg}" height="12" fill="${c}"/>`,
  ).join("");
  const label = `WORLD CUP 2026 · ${STAGE_LABEL[STAGE] ?? STAGE.toUpperCase()}`;

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
        font-size="${f.label}" letter-spacing="6" fill="${MUTED}" font-weight="700">${esc(label)}</text>

  <text x="${cx}" y="${f.homeY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${homeFont}" font-weight="800" fill="${TEXT}" letter-spacing="2">${esc(m.home_team.toUpperCase())}</text>
  <text x="${cx}" y="${f.vsY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.vs}" font-weight="800" fill="${ACCENT}">v</text>
  <text x="${cx}" y="${f.awayY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${awayFont}" font-weight="800" fill="${TEXT}" letter-spacing="2">${esc(m.away_team.toUpperCase())}</text>

  <text x="${cx}" y="${f.detailY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.detail}" fill="${MUTED}">${esc(detailLine(m))}</text>
  <text x="${cx}" y="${f.footY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${f.foot}" font-weight="700" fill="${TEXT}">Predict the score · <tspan fill="${ACCENT}">verdocast.com</tspan></text>

  ${strip}
</svg>`;
}

const { createClient } = await import("@supabase/supabase-js");
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await db
  .from("matches")
  .select("match_code, home_team, away_team, kickoff_utc, venue, venue_city")
  .eq("stage", STAGE)
  .order("kickoff_utc", { ascending: true });

if (error) {
  console.error("DB read failed:", error.message);
  process.exit(1);
}
const resolved = (data ?? []).filter((m) => m.home_team && m.away_team);
const pending = (data ?? []).length - resolved.length;

const outDir = join(root, "og-exports", "matches", STAGE);
mkdirSync(outDir, { recursive: true });
for (const m of resolved) {
  const name = `${slug(m.home_team)}-v-${slug(m.away_team)}`;
  for (const f of FORMATS) {
    await sharp(Buffer.from(svg(m, f)))
      .png()
      .toFile(join(outDir, `${name}${f.suffix}.png`));
  }
  console.log("Wrote", name);
}
console.log(
  `\nDone - ${resolved.length} ${STAGE} graphics in ${outDir}` +
    (pending ? ` (${pending} ties not yet drawn - re-run as they resolve)` : ""),
);
