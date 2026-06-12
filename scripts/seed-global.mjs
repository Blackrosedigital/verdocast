// Idempotently create the public "Verdocast Global League" anyone can join.
//   node --env-file=.env.local scripts/seed-global.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env. Run with --env-file=.env.local");
  process.exit(1);
}
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OWNER = "global@verdocast.com";
const JOIN_CODE = "GLOBAL";

const existing = await admin
  .from("leagues")
  .select("id, slug, join_code")
  .eq("join_code", JOIN_CODE)
  .maybeSingle();
if (existing.data) {
  console.log("Global league already exists:", JSON.stringify(existing.data));
  process.exit(0);
}

let org = (
  await admin.from("organizations").select("id").eq("owner_email", OWNER).maybeSingle()
).data;
if (!org) {
  org = (
    await admin
      .from("organizations")
      .insert({ name: "Verdocast", owner_email: OWNER })
      .select()
      .single()
  ).data;
}

const license = (
  await admin
    .from("licenses")
    .insert({
      organization_id: org.id,
      tier: "team",
      max_members: 1000000,
      amount_paid_pence: 0,
      currency: "gbp",
      expires_at: "2026-10-19T00:00:00Z",
    })
    .select()
    .single()
).data;

const { data, error } = await admin
  .from("leagues")
  .insert({
    organization_id: org.id,
    license_id: license.id,
    name: "Verdocast Global League",
    slug: "global",
    join_code: JOIN_CODE,
    created_by_email: OWNER,
  })
  .select()
  .single();

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}
console.log("Created global league:", JSON.stringify(data));
