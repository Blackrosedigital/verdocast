// Provision a co-branded creator league. The infra is already live (branded
// join page, branded nav, ?ref= attribution) - this just mints the league row.
//
// DB writes go through the Supabase SQL Editor (service-role key is provisioned
// there), so this script GENERATES a ready-to-paste SQL transaction rather than
// writing directly. It also prints the shareable, attributed links.
//
// Usage:
//   node scripts/create-creator-league.mjs \
//     --name "Ron's Rivals" \
//     --code RONS-RIVALS \
//     --email ron@example.com \
//     --color "#e6ff3d" \
//     --logo "https://.../ron-logo.png" \
//     --ref ron \
//     --max 1000
//
// Required: --name, --code, --email. Optional: --color, --logo, --ref, --max,
// --slug. Paste the printed SQL into the Supabase SQL Editor and run it.

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, tok, i, arr) => {
    if (tok.startsWith("--")) acc.push([tok.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const SITE = "https://verdocast.com";
const EXPIRES = "2026-10-19T00:00:00Z"; // tournament end + 90-day grace

function fail(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Escape a value for a single-quoted SQL string literal.
function sql(v) {
  return String(v).replace(/'/g, "''");
}

const name = args.name;
const code = args.code ? args.code.toUpperCase().trim() : "";
const email = args.email;
if (!name) fail("--name is required (e.g. --name \"Ron's Rivals\")");
if (!code) fail('--code is required (e.g. --code RONS-RIVALS)');
if (!email) fail("--email is required (the creator's email = league admin)");
if (!/^[A-Z0-9][A-Z0-9-]{2,40}$/.test(code))
  fail("--code must be 3-41 chars: A-Z, 0-9 and hyphens (e.g. RONS-RIVALS)");
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail("--email is not valid");

const slug = args.slug ? slugify(args.slug) : slugify(name);
const color = args.color ?? null;
const logo = args.logo ?? null;
const max = args.max ? Number.parseInt(args.max, 10) : 1000;
const ref = args.ref ? String(args.ref).trim() : slug;
if (!Number.isFinite(max) || max <= 0) fail("--max must be a positive integer");
if (color && !/^#[0-9a-fA-F]{6}$/.test(color))
  fail('--color must be a 6-digit hex like "#e6ff3d"');

const brandColorSql = color ? `'${sql(color)}'` : "null";
const brandLogoSql = logo ? `'${sql(logo)}'` : "null";

const sqlBlock = `-- Co-branded creator league: ${sql(name)}  (code ${sql(code)})
-- Paste into the Supabase SQL Editor and run. Idempotent on join_code:
-- re-running with the same --code is blocked by the unique constraint.
with org as (
  insert into organizations (name, owner_email)
  values ('${sql(name)}', '${sql(email)}')
  returning id
),
lic as (
  insert into licenses (organization_id, tier, max_members, amount_paid_pence, currency, expires_at)
  select id, 'team', ${max}, 0, 'gbp', '${EXPIRES}' from org
  returning id, organization_id
)
insert into leagues (
  organization_id, license_id, name, slug, join_code, created_by_email,
  brand_color, brand_logo_url
)
select
  lic.organization_id, lic.id,
  '${sql(name)}', '${sql(slug)}', '${sql(code)}', '${sql(email)}',
  ${brandColorSql}, ${brandLogoSql}
from lic
returning id, name, join_code;`;

const joinUrl = `${SITE}/league/${code}/join?ref=${encodeURIComponent(ref)}`;

console.log(`
Co-branded creator league — provisioning kit
============================================
  Name        ${name}
  Join code   ${code}
  Admin email ${email}
  Slug        ${slug}
  Brand color ${color ?? "(none)"}
  Brand logo  ${logo ?? "(none)"}
  Max members ${max}
  Attribution ?ref=${ref}

1) Run this in the Supabase SQL Editor
--------------------------------------
${sqlBlock}

2) Share these links with the creator
-------------------------------------
  Join (attributed):  ${joinUrl}
  Predictions:        ${SITE}/league/${code}/predict
  Leaderboard:        ${SITE}/league/${code}/leaderboard

The join page applies the brand colour + logo automatically, the nav carries the
accent through, and ?ref=${ref} attributes signups to this creator in /admin/stats.
`);
