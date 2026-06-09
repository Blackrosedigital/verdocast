"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { signInWithEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { generateJoinCode, slugify } from "@/lib/join-codes";
import { resolveOnboarding } from "@/lib/onboarding";
import type { Database, Tables } from "@/types/db";

export type CompleteOnboardingResult = {
  ok: false;
  error: string;
  code: string;
};

const Schema = z.object({
  sessionId: z.string().min(1),
  orgName: z.string().trim().min(1, "Enter your company name").max(120),
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
  // Retry on unique-constraint conflicts (join_code or (org, slug)).
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
 * Finish onboarding: re-verify the Checkout Session server-side (never trust the
 * client), set the org name, create the first league, sign the buyer in, and
 * redirect to the admin dashboard. Returns only on failure; success redirects.
 */
export async function completeOnboarding(input: {
  sessionId: string;
  orgName: string;
  leagueName: string;
}): Promise<CompleteOnboardingResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      code: "invalid_input",
    };
  }
  const { sessionId, orgName, leagueName } = parsed.data;

  const resolution = await resolveOnboarding(sessionId);
  if (resolution.status !== "ok") {
    return {
      ok: false,
      error: "Your checkout session could not be verified.",
      code: "invalid_session",
    };
  }

  const { org, license, email, existingLeague } = resolution;
  const admin = createAdminClient();

  await admin
    .from("organizations")
    .update({ name: orgName, updated_at: new Date().toISOString() })
    .eq("id", org.id);

  // Idempotent: if a league already exists (re-submit/refresh), reuse it.
  const league =
    existingLeague ??
    (await createLeague(admin, { org, license, leagueName, email }));
  if (!league) {
    return {
      ok: false,
      error: "Could not create your league. Please try again.",
      code: "league_create_failed",
    };
  }

  await signInWithEmail(email);

  redirect(
    `/admin/league/${league.slug}?welcome=${encodeURIComponent(league.join_code)}`,
  );
}
