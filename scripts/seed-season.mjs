// Seed a competition's teams and fixtures from API-Football into the
// competitions/seasons/teams/fixtures model.
//
//   node --env-file=.env.local scripts/seed-season.mjs premier-league
//   node --env-file=.env.local scripts/seed-season.mjs champions-league --dry-run
//
// Idempotent: teams key on provider_team_id, fixtures on provider_fixture_id,
// so re-running updates in place rather than duplicating. Safe to re-run after
// a postponement or a corrected result. Runs in one transaction.
//
// This seeds SCHEDULE AND RESULTS ONLY. It never touches predictions or
// points — fixtures that are already finished simply arrive finished, and
// nobody has predictions against them.

import pg from "pg";

const API_BASE = "https://v3.football.api-sports.io";

const slug = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!slug) {
  console.error("Usage: seed-season.mjs <competition-slug> [--dry-run]");
  process.exit(1);
}

const apiKey = process.env.API_FOOTBALL_KEY;
const connectionString = process.env.DATABASE_URL;
if (!apiKey || !connectionString) {
  console.error("Missing API_FOOTBALL_KEY or DATABASE_URL.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Round -> (stage, matchday)
//
// The provider expresses the round as free text that differs per competition:
//   Premier League   "Regular Season - 7"      -> regular / 7
//   Champions League "League Stage - 2"        -> league_phase / 2
//                    "Round of 16"             -> r16 / null
//
// Returning null means "not part of this product's season" and the fixture is
// skipped. That is how UCL qualifying rounds are excluded: they are played in
// July/August between 81 clubs before the 36-team league phase exists, and are
// not something anyone predicts here.
//
// NOTE the deliberate ordering trap: for UCL the provider uses "Play-offs" for
// the AUGUST QUALIFYING play-off, while the February knockout play-off round
// appears as "Knockout Round Play-offs". Matching loosely on "play-off" would
// silently pull 14 qualifying fixtures into the season. Qualifying rounds are
// therefore matched and rejected explicitly, before anything else.
// ---------------------------------------------------------------------------
const QUALIFYING = /qualifying round|^play-?offs$/i;

function mapRound(round) {
  if (QUALIFYING.test(round.trim())) return null;

  const league = round.match(/^(?:Regular Season|League Stage)\s*-\s*(\d+)$/i);
  if (league) {
    return {
      stage: /regular season/i.test(round) ? "regular" : "league_phase",
      matchday: Number(league[1]),
    };
  }

  const r = round.toLowerCase();
  if (r.includes("knockout") && r.includes("play")) return { stage: "playoff", matchday: null };
  if (r.includes("round of 32")) return { stage: "r32", matchday: null };
  if (r.includes("round of 16")) return { stage: "r16", matchday: null };
  if (r.includes("quarter")) return { stage: "qf", matchday: null };
  if (r.includes("semi")) return { stage: "sf", matchday: null };
  if (r.includes("3rd place") || r.includes("third place")) return { stage: "third", matchday: null };
  if (r.includes("final")) return { stage: "final", matchday: null };
  return null;
}

// Provider status short code -> our match_status enum.
function mapStatus(short) {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"].includes(short)) return "live";
  if (["PST", "CANC", "ABD", "AWD", "WO"].includes(short)) return "postponed";
  return "scheduled";
}

// Club colours. The product renders colour + name rather than crests, which
// are trademarked (docs/tech-foundation.md A1). Anything not listed falls back
// to a deterministic colour derived from the name, so the UI is never blank
// and a given club always looks the same.
const CLUB_COLORS = {
  Arsenal: "#EF0107", "Aston Villa": "#95BFE5", Bournemouth: "#DA291C",
  Brentford: "#E30613", Brighton: "#0057B8", Burnley: "#6C1D45",
  Chelsea: "#034694", "Crystal Palace": "#1B458F", Everton: "#003399",
  Fulham: "#000000", Liverpool: "#C8102E", "Manchester City": "#6CABDD",
  "Manchester United": "#DA291C", Newcastle: "#241F20", "Nottingham Forest": "#DD0000",
  Sunderland: "#EB172B", Tottenham: "#132257", "West Ham": "#7A263A",
  Wolves: "#FDB913", Coventry: "#78D0F3", Leeds: "#FFCD00",
  "Real Madrid": "#FEBE10", Barcelona: "#A50044", "Atletico Madrid": "#CB3524",
  "Bayern München": "#DC052D", "Borussia Dortmund": "#FDE100", "Bayer Leverkusen": "#E32221",
  "RB Leipzig": "#DD0741", "VfB Stuttgart": "#E32219", "Eintracht Frankfurt": "#E1000F",
  "Paris Saint Germain": "#004170", Lille: "#E01E13", Monaco: "#E63329", Lens: "#FFE500",
  Inter: "#0068A8", "AC Milan": "#FB090B", Juventus: "#000000", Napoli: "#12A0D7",
  Atalanta: "#1E71B8", "AS Roma": "#8E1F2F", Como: "#005BAC",
  "FC Porto": "#003DA5", Benfica: "#E30613",
  "Sporting CP": "#008057", Ajax: "#D2122E", "PSV Eindhoven": "#ED1C24", Feyenoord: "#DD0000",
  "Club Brugge KV": "#005EB8", "Galatasaray": "#A90432", "Olympiakos Piraeus": "#E30613",
  "AEK Athens FC": "#FFD100", "Lask Linz": "#000000", "Red Bull Salzburg": "#C8102E",
  "Slavia Praha": "#D7141A", Villarreal: "#FFE667", "Real Betis": "#00954C",
  "Athletic Club": "#EE2523", "Marseille": "#2FAEE0", Copenhagen: "#092E5E",
  "Union St. Gilloise": "#FFE500", "Bodo/Glimt": "#FFD700", Qarabag: "#000000",
  "Fenerbahçe": "#1B295C", "Shakhtar Donetsk": "#FF6600", "Slovan Bratislava": "#0067B1",
  Viking: "#002F87", "Sabah FA": "#009B48",
  "Hull City": "#F5A12D", Ipswich: "#0044A9",
};

function fallbackColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 62%, 45%)`;
}

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { "x-apisports-key": apiKey } });
  const json = await res.json();
  const errors = json.errors;
  if (errors && (Array.isArray(errors) ? errors.length : Object.keys(errors).length)) {
    throw new Error(`API-Football ${path}: ${JSON.stringify(errors)}`);
  }
  return json.response ?? [];
}

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();

  const { rows: seasons } = await client.query(
    `select s.id season_id, s.label, s.status, c.name competition,
            c.provider_competition_id league_id, s.provider_season_id
       from seasons s join competitions c on c.id = s.competition_id
      where c.slug = $1
      order by s.starts_on desc nulls last
      limit 1`,
    [slug],
  );
  const season = seasons[0];
  if (!season) throw new Error(`No season found for competition "${slug}". Seed it in a migration first.`);
  console.log(`${season.competition} ${season.label} (${season.status}) — league ${season.league_id}, season ${season.provider_season_id}`);

  const [apiTeams, apiFixtures] = await Promise.all([
    apiGet(`/teams?league=${season.league_id}&season=${season.provider_season_id}`),
    apiGet(`/fixtures?league=${season.league_id}&season=${season.provider_season_id}`),
  ]);

  // Keep only fixtures that belong to this product's season, and note which
  // rounds were rejected so an unexpected provider label is visible rather
  // than silently dropping fixtures.
  const kept = [];
  const skipped = new Map();
  for (const f of apiFixtures) {
    const mapped = mapRound(f.league.round);
    if (!mapped) {
      skipped.set(f.league.round, (skipped.get(f.league.round) ?? 0) + 1);
      continue;
    }
    kept.push({ ...f, mapped });
  }
  console.log(`fixtures: ${apiFixtures.length} from provider, ${kept.length} in season`);
  if (skipped.size) {
    console.log("  skipped rounds:", [...skipped].map(([r, n]) => `${r} (${n})`).join(", "));
  }

  // Teams that actually appear in the kept fixtures — for the UCL this is the
  // 36 league-phase clubs, not the 81 that entered qualifying.
  const playing = new Map();
  for (const f of kept) {
    playing.set(f.teams.home.id, f.teams.home.name);
    playing.set(f.teams.away.id, f.teams.away.name);
  }
  const enrich = new Map(apiTeams.map((t) => [t.team.id, t.team]));
  console.log(`teams: ${playing.size} in season (${apiTeams.length} returned by provider)`);

  if (dryRun) {
    console.log("\n--- dry run, no writes ---");
    const byMatchday = {};
    for (const f of kept) {
      const k = f.mapped.matchday ?? f.mapped.stage;
      byMatchday[k] = (byMatchday[k] ?? 0) + 1;
    }
    console.log("per matchday/stage:", JSON.stringify(byMatchday));
    return;
  }

  await client.query("begin");

  let teamsWritten = 0;
  const teamIdByProvider = new Map();
  for (const [providerId, name] of playing) {
    const meta = enrich.get(providerId) ?? {};
    const { rows } = await client.query(
      `insert into teams (sport, name, short_code, slug, country, primary_color, crest_url, provider, provider_team_id)
       values ('football', $1, $2, $3, $4, $5, $6, 'api-football', $7)
       on conflict (provider, provider_team_id) do update
         set name = excluded.name,
             short_code = coalesce(excluded.short_code, teams.short_code),
             country = coalesce(excluded.country, teams.country),
             -- A curated colour, once set, wins over anything the seeder
             -- offers. A generated fallback is not a real choice, so it is
             -- allowed to be upgraded when the club gets a curated colour.
             primary_color = case
               when teams.primary_color is null or teams.primary_color like 'hsl%'
                 then excluded.primary_color
               else teams.primary_color
             end,
             crest_url = coalesce(excluded.crest_url, teams.crest_url),
             updated_at = now()
       returning id`,
      [
        name,
        meta.code ?? null,
        slugify(name),
        meta.country ?? null,
        CLUB_COLORS[name] ?? fallbackColor(name),
        meta.logo ?? null,
        String(providerId),
      ],
    );
    teamIdByProvider.set(providerId, rows[0].id);
    teamsWritten += 1;
  }

  let inserted = 0;
  let updated = 0;
  for (const f of kept) {
    const status = mapStatus(f.fixture.status.short);
    // Score the 90-minute result: extra time and penalties don't count, which
    // matches how the World Cup knockout was scored (jobs/ingest-results.ts).
    const ft = f.score?.fulltime;
    const home = status === "finished" && ft?.home != null ? ft.home : f.goals.home;
    const away = status === "finished" && ft?.away != null ? ft.away : f.goals.away;
    const result =
      status !== "finished" || home == null || away == null
        ? null
        : home > away ? "H" : home < away ? "A" : "D";

    const { rows } = await client.query(
      `insert into fixtures (
         season_id, stage, matchday, home_team_id, away_team_id, kickoff_utc,
         venue, venue_city, status, home_score, away_score, result,
         provider_fixture_id, finalised_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::match_status,$10,$11,$12,$13,
                 case when $9::match_status = 'finished' then now() else null end)
       on conflict (provider_fixture_id) do update
         set stage = excluded.stage,
             matchday = excluded.matchday,
             home_team_id = excluded.home_team_id,
             away_team_id = excluded.away_team_id,
             kickoff_utc = excluded.kickoff_utc,
             venue = coalesce(excluded.venue, fixtures.venue),
             venue_city = coalesce(excluded.venue_city, fixtures.venue_city),
             status = excluded.status,
             home_score = excluded.home_score,
             away_score = excluded.away_score,
             result = excluded.result,
             -- preserve the original finalisation time across re-runs
             finalised_at = coalesce(fixtures.finalised_at, excluded.finalised_at),
             updated_at = now()
       returning (xmax = 0) as was_insert`,
      [
        season.season_id,
        f.mapped.stage,
        f.mapped.matchday,
        teamIdByProvider.get(f.teams.home.id),
        teamIdByProvider.get(f.teams.away.id),
        f.fixture.date,
        f.fixture.venue?.name ?? null,
        f.fixture.venue?.city ?? null,
        status,
        home,
        away,
        result,
        String(f.fixture.id),
      ],
    );
    if (rows[0].was_insert) inserted += 1;
    else updated += 1;
  }

  await client.query("commit");
  console.log(`\nteams upserted: ${teamsWritten}`);
  console.log(`fixtures inserted: ${inserted}, updated: ${updated}`);
}

main()
  .catch(async (err) => {
    await client.query("rollback").catch(() => {});
    console.error("FAILED:", err.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
