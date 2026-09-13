"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { licenseExpiryFor, listJoinableCompetitions } from "@/lib/competitions";
import { createAdminClient } from "@/lib/db";
import { generateJoinCode, slugify } from "@/lib/join-codes";
import type { Database, Tables } from "@/types/db";

// Free-tier launch: group-stage predictions are free for everyone. Paid tiers
// (knockouts / B2B) come later — Stripe checkout stays in the codebase.
const FREE_MAX_MEMBERS = 1000;
// Fallback only, for a league with no season: the World Cup's end plus 90
// days. A season league derives its expiry from the season itself
// (licenseExpiryFor), because a Premier League league created today runs to
// May 2027 and a licence expiring in October 2026 would strand it.
const LICENSE_EXPIRES_AT = "2026-10-19T00:00:00Z";

export type CreateFreeResult = { ok: false; error: string; code: string };

const Schema = z.object({
  orgName: z.string().trim().min(1, "Enter your company or group name").max(120),
  leagueName: z.string().trim().min(1, "Enter a league name").max(120),
  // Competition slug, e.g. "premier-league". Optional so existing callers and
  // any in-flight World Cup league keep working unbound.
  competition: z.string().trim().min(1).max(80).optional(),
});

interface BoundSeason {
  seasonId: string;
  startMatchday: number | null;
  endsOn: string | null;
}

/**
 * Resolve a competition slug to the season a new league should be bound to,
 * and the matchday it should start scoring from.
 *
 * An unknown or finished competition is rejected rather than silently creating
 * an unbound league: someone who picked "Premier League" must not end up in a
 * league that predicts nothing.
 */
async function resolveSeason(
  competition: string,
): Promise<BoundSeason | { error: CreateFreeResult }> {
  const available = await listJoinableCompetitions();
  const match = available.find((c) => c.competitionSlug === competition);
  if (!match) {
    return {
      error: {
        ok: false,
        error: "That competition isn't available to join.",
        code: "unknown_competition",
      },
    };
  }
  if (match.startMatchday == null) {
    return {
      error: {
        ok: false,
        error: `${match.competitionName} has no ${match.unitLabel.toLowerCase()}s left to play.`,
        code: "season_over",
      },
    };
  }
  return {
    seasonId: match.seasonId,
    startMatchday: match.startMatchday,
    endsOn: match.endsOn,
  };
}

async function createLeague(
  admin: SupabaseClient<Database>,
  {
    org,
    license,
    leagueName,
    email,
    seasonId = null,
    startMatchday = null,
  }: {
    org: Tables<"organizations">;
    license: Tables<"licenses">;
    leagueName: string;
    email: string;
    seasonId?: string | null;
    startMatchday?: number | null;
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
        season_id: seasonId,
        start_matchday: startMatchday,
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
  const { orgName, leagueName, competition } = parsed.data;
  const admin = createAdminClient();

  const resolved = competition ? await resolveSeason(competition) : null;
  if (resolved && "error" in resolved) return resolved.error;
  const season = resolved && !("error" in resolved) ? resolved : null;

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
        expires_at: season
          ? licenseExpiryFor(season.endsOn)
          : LICENSE_EXPIRES_AT,
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
    existing ??
    (await createLeague(admin, {
      org,
      license,
      leagueName,
      email,
      seasonId: season?.seasonId ?? null,
      startMatchday: season?.startMatchday ?? null,
    }));
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

const AnotherSchema = z.object({
  leagueName: z.string().trim().min(1, "Enter a league name").max(120),
  competition: z.string().trim().min(1).max(80).optional(),
});

/**
 * Create an ADDITIONAL league under the caller's existing org (e.g. a second
 * department). Unlike createFreeLeague this never reuses an existing league — it
 * always makes a new one, sharing the org's free license.
 */
export async function createAnotherLeague(input: {
  leagueName: string;
  competition?: string;
}): Promise<CreateFreeResult> {
  const user = await requireUser();
  const email = (user.email ?? "").toLowerCase();
  if (!email) {
    return { ok: false, error: "No email on your account.", code: "no_email" };
  }
  const parsed = AnotherSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      code: "invalid_input",
    };
  }
  const { leagueName, competition } = parsed.data;
  const admin = createAdminClient();

  const season = competition ? await resolveSeason(competition) : null;
  if (season && "error" in season) return season.error;
  const bound = season && !("error" in season) ? season : null;

  const { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("owner_email", email)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!org) {
    return { ok: false, error: "Create your first league first.", code: "no_org" };
  }

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
        expires_at: bound ? licenseExpiryFor(bound.endsOn) : LICENSE_EXPIRES_AT,
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

  const league = await createLeague(admin, {
    org,
    license,
    leagueName,
    email,
    seasonId: bound?.seasonId ?? null,
    startMatchday: bound?.startMatchday ?? null,
  });
  if (!league) {
    return {
      ok: false,
      error: "Could not create your league.",
      code: "league_failed",
    };
  }

  await admin.from("members").upsert(
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
