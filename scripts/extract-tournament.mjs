// Extract World Cup 2026 tournament data from reference/wc2026.html into
// data/tournament-2026.json. Provenance/regeneration tool — run when the
// reference data changes:  node scripts/extract-tournament.mjs
//
// Source `const DATA = {...}` in the HTML holds: groups, teams, fixtures (72
// group matches), knockout (32), venues (16). Kickoff times are in US Eastern
// (ET); the whole tournament (11 Jun – 19 Jul 2026) is in EDT (UTC-4), so we
// convert with an explicit -04:00 offset (correctly rolls evening games to the
// next UTC day).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function extractData(html) {
  const marker = "const DATA = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("`const DATA =` not found in wc2026.html");
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}" && --depth === 0) {
      return JSON.parse(html.slice(open, i + 1));
    }
  }
  throw new Error("Unbalanced braces while extracting DATA");
}

/** ET wall-clock -> UTC ISO string (EDT = UTC-4 for the whole tournament). */
function toUtc(date, timeET) {
  return new Date(`${date}T${timeET}:00-04:00`)
    .toISOString()
    .replace(".000Z", "Z");
}

const KNOCKOUT = {
  R32: { stage: "r32", code: "R32", numbered: true },
  R16: { stage: "r16", code: "R16", numbered: true },
  QF: { stage: "qf", code: "QF", numbered: true },
  SF: { stage: "sf", code: "SF", numbered: true },
  "3rd": { stage: "third", code: "THIRD", numbered: false },
  F: { stage: "final", code: "FINAL", numbered: false },
};

const html = readFileSync(join(root, "reference", "wc2026.html"), "utf8");
const DATA = extractData(html);

// URL-safe slug from a team name (e.g. "South Korea" -> "south-korea").
function teamSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---- teams (48), in group order ----
const teams = [];
for (const letter of Object.keys(DATA.groups).sort()) {
  for (const name of DATA.groups[letter]) {
    const t = DATA.teams[name] ?? {};
    teams.push({
      name,
      slug: teamSlug(name),
      code: t.code ?? null,
      confederation: t.confed ?? null,
      route: t.route ?? null,
      coach: t.coach ?? null,
      flag: t.flag ?? null,
      group_letter: letter,
    });
  }
}

// ---- squads (separate file; large, only the team page needs it) ----
const squads = {};
for (const name of Object.keys(DATA.squads ?? {})) {
  const s = DATA.squads[name] ?? {};
  squads[name] = {
    status: s.status ?? null,
    confirmed: s.confirmed ?? false,
    players: (s.players ?? []).map((p) => ({
      name: p.name,
      pos: p.pos ?? null,
      club: p.club ?? null,
    })),
  };
}

// ---- venues (16) ----
const venues = DATA.venues.map((v) => ({
  name: v.name,
  fifa_name: v.fifaName ?? null,
  city: v.city,
  country: v.country,
  capacity: v.cap ?? null,
  hosts: v.hosts ?? null,
}));

// ---- matches (104) ----
const matches = [];

// group stage: GROUP_<letter>_<n> (n = 1..6 within the group, fixture order)
const groupCounter = {};
for (const f of DATA.fixtures) {
  groupCounter[f.group] = (groupCounter[f.group] ?? 0) + 1;
  matches.push({
    match_code: `GROUP_${f.group}_${groupCounter[f.group]}`,
    kickoff_utc: toUtc(f.date, f.timeET),
    stage: "group",
    group_letter: f.group,
    home_team: f.home,
    away_team: f.away,
    venue: f.venue,
    venue_city: f.city,
    matchup: null,
  });
}

// knockout: home/away teams unknown until draws → null (CLAUDE.md). `matchup`
// keeps the bracket placeholder (e.g. "2A vs 2B") for reference.
const roundCounter = {};
for (const k of DATA.knockout) {
  const meta = KNOCKOUT[k.round];
  if (!meta) throw new Error(`Unknown knockout round: ${k.round}`);
  roundCounter[k.round] = (roundCounter[k.round] ?? 0) + 1;
  const code = meta.numbered
    ? `${meta.code}_${roundCounter[k.round]}`
    : meta.code;
  matches.push({
    match_code: code,
    kickoff_utc: toUtc(k.date, k.timeET),
    stage: meta.stage,
    group_letter: null,
    home_team: null,
    away_team: null,
    venue: k.venue,
    venue_city: k.city,
    matchup: k.matchup ?? null,
  });
}

// ---- assertions ----
const codes = new Set(matches.map((m) => m.match_code));
if (matches.length !== 104) throw new Error(`Expected 104 matches, got ${matches.length}`);
if (codes.size !== 104) throw new Error("Duplicate match_code detected");
if (teams.length !== 48) throw new Error(`Expected 48 teams, got ${teams.length}`);
if (venues.length !== 16) throw new Error(`Expected 16 venues, got ${venues.length}`);

const output = {
  _comment:
    "Generated from reference/wc2026.html by scripts/extract-tournament.mjs. Do not edit by hand.",
  tournament: {
    name: "FIFA World Cup 2026",
    start: "2026-06-11",
    end: "2026-07-19",
    team_count: teams.length,
    venue_count: venues.length,
    match_count: matches.length,
  },
  teams,
  venues,
  matches,
};

mkdirSync(join(root, "data"), { recursive: true });
const outPath = join(root, "data", "tournament-2026.json");
writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n", "utf8");

const squadsPath = join(root, "data", "squads-2026.json");
writeFileSync(squadsPath, JSON.stringify(squads, null, 2) + "\n", "utf8");

const byStage = matches.reduce((a, m) => ((a[m.stage] = (a[m.stage] ?? 0) + 1), a), {});
console.log(`Wrote ${outPath}`);
console.log(`  matches: ${matches.length}`, JSON.stringify(byStage));
console.log(`  teams: ${teams.length}  venues: ${venues.length}`);
console.log(`  squads: ${Object.keys(squads).length} -> ${squadsPath}`);
