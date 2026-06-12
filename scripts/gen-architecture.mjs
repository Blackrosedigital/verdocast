// Generate a branded Verdocast system-architecture diagram (SVG -> PNG).
//   node scripts/gen-architecture.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const BG = "#0a0b0d";
const SURFACE = "#14161a";
const SURFACE2 = "#1c1f24";
const BORDER = "#2a2d33";
const TEXT = "#f5f3ee";
const MUTED = "#8a8d93";
const ACCENT = "#e6ff3d";
const BLUE = "#2563EB";
const VIOLET = "#7C3AED";
const PINK = "#ff3b6a";
const GREEN = "#059669";
const GOLD = "#d4a045";

const W = 1600;
const H = 1000;
const F = "Arial, Helvetica, sans-serif";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function card({ x, y, w, h, title, items = [], accent = ACCENT }) {
  const lines = items
    .map(
      (t, i) =>
        `<text x="${x + 20}" y="${y + 60 + i * 24}" font-family="${F}" font-size="15" fill="${MUTED}">${esc(t)}</text>`,
    )
    .join("");
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${SURFACE}" stroke="${BORDER}" stroke-width="1.5"/>
    <rect x="${x}" y="${y + 14}" width="6" height="${h - 28}" rx="3" fill="${accent}"/>
    <text x="${x + 20}" y="${y + 33}" font-family="${F}" font-size="18" font-weight="700" fill="${TEXT}">${esc(title)}</text>
    ${lines}`;
}

function arrow(x1, y1, x2, y2, label) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const lbl = label
    ? `<rect x="${mx - label.length * 4.4 - 8}" y="${my - 14}" width="${label.length * 8.8 + 16}" height="22" rx="6" fill="${BG}" stroke="${BORDER}" stroke-width="1"/>
       <text x="${mx}" y="${my + 1}" text-anchor="middle" font-family="${F}" font-size="13" fill="${ACCENT}">${esc(label)}</text>`
    : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${MUTED}" stroke-width="2" marker-end="url(#arrow)"/>${lbl}`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="${MUTED}"/>
    </marker>
    <radialGradient id="glow" cx="20%" cy="0%" r="80%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.05"/>
      <stop offset="55%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- title -->
  <text x="64" y="58" font-family="${F}" font-size="34" font-weight="800" fill="${TEXT}">Verdo<tspan fill="${ACCENT}">cast</tspan></text>
  <text x="64" y="86" font-family="${F}" font-size="17" fill="${MUTED}" letter-spacing="2">SYSTEM ARCHITECTURE</text>

  <!-- users -->
  ${card({ x: 600, y: 120, w: 400, h: 70, title: "Users — Web browser", accent: ACCENT, items: ["Visitors · League admins · Members"] })}

  <!-- vercel / next.js container -->
  <rect x="64" y="236" width="1472" height="372" rx="18" fill="${SURFACE2}" stroke="${BORDER}" stroke-width="1.5"/>
  <text x="88" y="270" font-family="${F}" font-size="19" font-weight="700" fill="${TEXT}">Vercel  ·  Next.js 15 (App Router) + Cron</text>

  ${card({ x: 88, y: 300, w: 332, h: 286, title: "Marketing (static)", accent: ACCENT, items: ["/  landing", "/pricing", "/demo", "/privacy · /terms", "OG + Twitter cards"] })}
  ${card({ x: 444, y: 300, w: 332, h: 286, title: "App pages (RSC)", accent: BLUE, items: ["/start  (free signup)", "/onboarding/[session]", "/admin · /admin/league/[slug]", "/league/[code]/predict", "/league/[code]/leaderboard", "/login"] })}
  ${card({ x: 800, y: 300, w: 350, h: 286, title: "Server Actions", accent: VIOLET, items: ["createFreeLeague", "startCheckout · completeOnboarding", "sendInvitations · joinLeague", "submitPrediction", "getLeaderboard", "(Zod-validated, service role)"] })}
  ${card({ x: 1174, y: 300, w: 338, h: 286, title: "Route handlers + Cron", accent: PINK, items: ["/api/stripe/webhook", "/api/ingest/results", "/auth/callback · /auth/signout", "", "Vercel Cron  */5  ->", "ingest-results job"] })}

  <!-- supabase -->
  ${card({ x: 64, y: 668, w: 760, h: 256, title: "Supabase", accent: GREEN, items: ["Postgres — organizations, licenses, leagues,", "members, matches, predictions (+ leaderboard view)", "Row-Level Security (email-based) · triggers", "", "Auth — magic link · email OTP · Google OAuth", "Custom SMTP -> Resend"] })}

  <!-- external services -->
  ${card({ x: 856, y: 668, w: 680, h: 256, title: "External services", accent: GOLD, items: ["Stripe — Checkout + webhooks (payments)", "Resend — transactional email + auth SMTP", "API-Football — live match results", "Google — OAuth sign-in", "PostHog — product analytics (consent-gated)"] })}

  <!-- arrows -->
  ${arrow(800, 192, 800, 234, "HTTPS")}
  ${arrow(420, 608, 420, 666, "SQL · service role")}
  ${arrow(1190, 608, 1190, 666, "API / SDK")}

  <!-- footer legend -->
  <text x="64" y="958" font-family="${F}" font-size="14" fill="${MUTED}">Key flows:  Browser ⇄ Next.js (HTTPS)   ·   Actions/RSC ⇄ Postgres (RLS)   ·   Stripe webhook -> license state   ·   Cron */5 -> API-Football -> auto-scoring   ·   Auth (Google/OTP) -> Resend SMTP</text>
  <text x="${W - 64}" y="86" text-anchor="end" font-family="${F}" font-size="16" font-weight="700" fill="${MUTED}">verdocast.com</text>
</svg>`;

mkdirSync(join(root, "public"), { recursive: true });
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "docs", "architecture.svg"), svg, "utf8");
await sharp(Buffer.from(svg)).png().toFile(join(root, "public", "architecture.png"));
console.log("Wrote docs/architecture.svg and public/architecture.png");
