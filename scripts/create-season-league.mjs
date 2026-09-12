// Create a league bound to a competition's current season.
//
//   node --env-file=.env.local scripts/create-season-league.mjs \
//     --competition=champions-league --name="UCL Test League" \
//     --email=you@example.com [--start-matchday=2] [--code=MIGHTY-LIONS]
//
// Stands in for the `/start` competition picker until that ships (Phase 4 of
// docs/season-launch-plan.md). Creates the organization, a free license and
// the league, and adds the given email as an admin member.
//
// --start-matchday defaults to the next matchday NOTHING has kicked off in
// yet. That is stricter than "has an unplayed fixture" on purpose: a league
// starting halfway through a gameweek is internally fair — everyone misses the
// same games — but it opens on "you can predict 5 of 10", which is a poor
// first impression. A league should start on a clean, fully predictable week.
//
// Note this is a different question from which matchday a RETURNING member
// lands on (lib/season.ts pickDefaultMatchday), where mid-gameweek is exactly
// where they want to be, because per-match locking means the rest is still
// open to them.

import pg from "pg";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=") || true];
  }),
);

const slug = args.competition;
const name = args.name;
const email = args.email;
if (!slug || !name || !email) {
  console.error(
    "Usage: create-season-league.mjs --competition=<slug> --name=<name> --email=<email> [--start-matchday=N] [--code=JOIN-CODE]",
  );
  process.exit(1);
}

function randomCode() {
  const left = ["MIGHTY", "RAPID", "IRON", "NORTHERN", "GOLDEN", "WILD"];
  const right = ["LIONS", "FOXES", "RAVENS", "COMETS", "BADGERS", "STAGS"];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return `${pick(left)}-${pick(right)}`;
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const { rows: seasons } = await client.query(
    `select s.id, s.label, c.name competition, c.kind
       from seasons s join competitions c on c.id = s.competition_id
      where c.slug = $1 order by s.starts_on desc nulls last limit 1`,
    [slug],
  );
  const season = seasons[0];
  if (!season) throw new Error(`No season for competition "${slug}".`);

  let startMatchday = args["start-matchday"] ? Number(args["start-matchday"]) : null;
  if (startMatchday == null) {
    const { rows } = await client.query(
      `select min(matchday)::int md from fixtures
        where season_id = $1 and matchday is not null
          and matchday not in (
            select matchday from fixtures
             where season_id = $1 and matchday is not null and kickoff_utc <= now()
          )`,
      [season.id],
    );
    startMatchday = rows[0]?.md ?? 1;
  }

  const joinCode = (args.code || randomCode()).toUpperCase();
  const leagueSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  await client.query("begin");

  const { rows: orgs } = await client.query(
    `insert into organizations (name, owner_email) values ($1, $2) returning id`,
    [name, email],
  );
  const orgId = orgs[0].id;

  // A free league still needs a license row: it is what caps membership.
  const { rows: licenses } = await client.query(
    `insert into licenses (organization_id, tier, max_members, amount_paid_pence, expires_at)
     values ($1, 'starter', 50, 0, now() + interval '1 year') returning id`,
    [orgId],
  );
  const licenseId = licenses[0].id;

  const { rows: leagues } = await client.query(
    `insert into leagues (organization_id, license_id, name, slug, join_code,
                          created_by_email, season_id, start_matchday)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [orgId, licenseId, name, leagueSlug, joinCode, email, season.id, startMatchday],
  );
  const leagueId = leagues[0].id;

  await client.query(
    `insert into members (league_id, email, display_name, is_admin)
     values ($1, $2, $3, true)`,
    [leagueId, email, email.split("@")[0]],
  );

  await client.query("commit");

  console.log(`${season.competition} ${season.label} (${season.kind})`);
  console.log(`league:         ${name}`);
  console.log(`join code:      ${joinCode}`);
  console.log(`start matchday: ${startMatchday}`);
  console.log(`predict at:     /league/${joinCode}/predict`);
}

main()
  .catch(async (err) => {
    await client.query("rollback").catch(() => {});
    console.error("FAILED:", err.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
