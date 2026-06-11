"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { generateJoinCode, slugify } from "@/lib/join-codes";
import type { Database, Tables } from "@/types/db";

// Free-tier launch: group-stage predictions are free for everyone. Paid tiers
// (knockouts / B2B) come later — Stripe checkout stays in the codebase.
const FREE_MAX_MEMBERS = 1000;
const LICENSE_EXPIRES_AT = "2026-10-19T00:00:00Z";

export type CreateFreeResult = { ok: false; error: string; code: string };

const Schema = z.object({
  orgName: z.string().trim().min(1, "Enter your company or group name").max(120),
  leagueName: z.string().trim().min(1, "Enter a league name").max(120),
});

async function createLeague(
  admin: SupabaseClient<Database>,
  {
    org,
    license,
    leagueName,
    email,
  }: {
    org: Tables<"organizations">;
    license: Tables<"licenses">;
    leagueName: string;
    email: string;
  },
): Promise<Tables<"leagues"> | null> {
  const baseSlug = slugify(leagueName);
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await admin
      .from("leagues")
      .insert({
        organization_id: org.id,
        license_id: license.id,
        name: leagueName,
        slug,
        join_code: generateJoinCode(),
        created_by_email: email,
      })
      .select()
      .single();
    if (!error && data) return data;
  }
  return null;
}

/**
 * Create a free league for the signed-in user (email already verified via the
 * magic-link signup). Provisions an org + a free license (no Stripe) + the first
 * league, and adds the creator as an admin member so they can predict too.
 * Idempotent: reuses the caller's existing org/league.
 */
export async function createFreeLeague(input: {
  orgName: string;
  leagueName: string;
}): Promise<CreateFreeResult> {
  const user = await requireUser();
  const email = (user.email ?? "").toLowerCase();
  if (!email) {
    return { ok: false, error: "No email on your account.", code: "no_email" };
  }

  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      code: "invalid_input",
    };
  }
  const { orgName, leagueName } = parsed.data;
  const admin = createAdminClient();

  // Org (reuse the caller's first org, else create).
  let { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("owner_email", email)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!org) {
    const created = await admin
      .from("organizations")
      .insert({ name: orgName, owner_email: email })
      .select()
      .single();
    org = created.data;
  } else {
    await admin.from("organizations").update({ name: orgName }).eq("id", org.id);
  }
  if (!org) {
    return { ok: false, error: "Could not create your org.", code: "org_failed" };
  }

  // Free license (reuse if present, else create).
  let { data: license } = await admin
    .from("licenses")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!license) {
    const created = await admin
      .from("licenses")
      .insert({
        organization_id: org.id,
        tier: "team",
        max_members: FREE_MAX_MEMBERS,
        amount_paid_pence: 0,
        currency: "gbp",
        expires_at: LICENSE_EXPIRES_AT,
      })
      .select()
      .single();
    license = created.data;
  }
  if (!license) {
    return {
      ok: false,
      error: "Could not set up your free plan.",
      code: "license_failed",
    };
  }

  // Reuse an existing (non-deleted) league, else create one.
  const { data: existing } = await admin
    .from("leagues")
    .select("*")
    .eq("organization_id", org.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const league =
    existing ?? (await createLeague(admin, { org, license, leagueName, email }));
  if (!league) {
    return {
      ok: false,
      error: "Could not create your league.",
      code: "league_failed",
    };
  }

  // Add the creator as an admin member so they can predict.
  await admin
    .from("members")
    .upsert(
      {
        league_id: league.id,
        email,
        display_name: email.split("@")[0] ?? "Organizer",
        is_admin: true,
      },
      { onConflict: "league_id,email", ignoreDuplicates: true },
    );

  redirect(
    `/admin/league/${league.slug}?welcome=${encodeURIComponent(league.join_code)}`,
  );
}
