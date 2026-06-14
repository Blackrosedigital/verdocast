"use server";

import { z } from "zod";
import { isSuperAdmin, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { sendPredictionReminder } from "@/lib/email";
import { predictionCountsByMember } from "@/lib/member-stats";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Cap emails per nudge so one click can't fan out to thousands (Resend limits +
// server-action time). The action reports how many remain so it can be re-run.
const NUDGE_BATCH = 100;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

type Authorized = {
  ok: true;
  admin: ReturnType<typeof createAdminClient>;
  league: {
    id: string;
    name: string;
    join_code: string;
    organization_id: string;
  };
  ownerEmail: string | null;
};
type Unauthorized = { ok: false; error: string; code: string };

/** Resolve a league the caller is allowed to administer (owner or platform admin). */
async function authorizeLeague(
  slug: string,
): Promise<Authorized | Unauthorized> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("id, name, join_code, organization_id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) return { ok: false, error: "League not found.", code: "not_found" };

  const { data: org } = await admin
    .from("organizations")
    .select("owner_email")
    .eq("id", league.organization_id)
    .maybeSingle();
  const isOwner = !!org?.owner_email && org.owner_email === user.email;
  if (!isOwner && !isSuperAdmin(user.email)) {
    return { ok: false, error: "You don’t own this league.", code: "forbidden" };
  }
  return { ok: true, admin, league, ownerEmail: org?.owner_email ?? null };
}

const SlugSchema = z.object({ slug: z.string().min(1) });

/**
 * Email a reminder to members of a league who have made zero predictions
 * (excluding the owner). Capped per call; returns how many were emailed and how
 * many non-predictors remain.
 */
export async function nudgeNonPredictors(input: {
  slug: string;
}): Promise<ActionResult<{ sent: number; remaining: number; skipped: boolean }>> {
  const parsed = SlugSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input.", code: "invalid_input" };
  }
  const auth = await authorizeLeague(parsed.data.slug);
  if (!auth.ok) return auth;
  const { admin, league, ownerEmail } = auth;

  const { data: members } = await admin
    .from("members")
    .select("id, email")
    .eq("league_id", league.id);
  const all = members ?? [];
  const counts = await predictionCountsByMember(
    admin,
    all.map((m) => m.id),
  );

  const owner = (ownerEmail ?? "").toLowerCase();
  const nonPredictors = all.filter(
    (m) => (counts.get(m.id) ?? 0) === 0 && m.email.toLowerCase() !== owner,
  );

  const joinUrl = `${SITE_URL}/league/${league.join_code}/join`;
  const batch = nonPredictors.slice(0, NUDGE_BATCH);

  let sent = 0;
  let skipped = false;
  for (const m of batch) {
    const res = await sendPredictionReminder(m.email, league.name, joinUrl);
    if (res.ok) sent++;
    else if ("skipped" in res && res.skipped) skipped = true;
  }

  return {
    ok: true,
    data: {
      sent,
      remaining: Math.max(0, nonPredictors.length - batch.length),
      skipped,
    },
  };
}

const RemoveSchema = z.object({
  slug: z.string().min(1),
  memberId: z.string().uuid(),
});

/**
 * Remove a member from a league (their predictions cascade-delete in the DB).
 * Owner or platform admin only. The owner cannot remove themselves here.
 */
export async function removeMember(input: {
  slug: string;
  memberId: string;
}): Promise<ActionResult> {
  const parsed = RemoveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input.", code: "invalid_input" };
  }
  const auth = await authorizeLeague(parsed.data.slug);
  if (!auth.ok) return auth;
  const { admin, league, ownerEmail } = auth;

  const { data: target } = await admin
    .from("members")
    .select("id, email")
    .eq("id", parsed.data.memberId)
    .eq("league_id", league.id)
    .maybeSingle();
  if (!target) {
    return { ok: false, error: "Member not found.", code: "not_found" };
  }
  if (
    ownerEmail &&
    target.email.toLowerCase() === ownerEmail.toLowerCase()
  ) {
    return {
      ok: false,
      error: "You can’t remove the league owner.",
      code: "cannot_remove_owner",
    };
  }

  const { error } = await admin
    .from("members")
    .delete()
    .eq("id", target.id)
    .eq("league_id", league.id);
  if (error) {
    return { ok: false, error: "Could not remove member.", code: "delete_failed" };
  }
  return { ok: true, data: undefined };
}
