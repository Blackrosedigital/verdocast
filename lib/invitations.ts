"use server";

import { z } from "zod";
import { requireUser, signInWithEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { sendInvitation } from "@/lib/email";
import { buildJoinUrl, normalizeEmail, verifyJoin } from "@/lib/sign-url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

export type InviteStatus =
  | "sent"
  | "link_only"
  | "failed"
  | "already_member";

export interface InviteResult {
  email: string;
  status: InviteStatus;
  joinUrl?: string;
}

const EmailSchema = z.string().email();

/**
 * Invite a batch of employees to a league. Verifies the caller owns the league
 * and that current members + new invites stay within the license cap. Each
 * invite gets an HMAC-signed join link emailed via Resend (or returned for
 * manual sharing when email isn't configured).
 */
export async function sendInvitations(
  leagueId: string,
  emails: string[],
): Promise<
  ActionResult<{ results: InviteResult[]; seatsRemaining: number }>
> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: league } = await admin
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .maybeSingle();
  if (!league) {
    return { ok: false, error: "League not found.", code: "not_found" };
  }

  const { data: org } = await admin
    .from("organizations")
    .select("owner_email")
    .eq("id", league.organization_id)
    .maybeSingle();
  if (!org || org.owner_email !== user.email) {
    return {
      ok: false,
      error: "You don’t have permission to invite to this league.",
      code: "forbidden",
    };
  }

  const { data: license } = await admin
    .from("licenses")
    .select("max_members")
    .eq("id", league.license_id)
    .maybeSingle();
  const cap = license?.max_members ?? 0;

  const cleaned = Array.from(
    new Set(
      emails
        .map((e) => normalizeEmail(e))
        .filter((e) => EmailSchema.safeParse(e).success),
    ),
  );
  if (cleaned.length === 0) {
    return {
      ok: false,
      error: "No valid email addresses found.",
      code: "no_emails",
    };
  }

  const { data: members } = await admin
    .from("members")
    .select("email")
    .eq("league_id", league.id);
  const existing = new Set((members ?? []).map((m) => m.email.toLowerCase()));
  const currentCount = existing.size;
  const newEmails = cleaned.filter((e) => !existing.has(e));

  if (currentCount + newEmails.length > cap) {
    const seatsLeft = Math.max(0, cap - currentCount);
    return {
      ok: false,
      error: `That would exceed your plan’s cap of ${cap} members. You have ${seatsLeft} seat(s) left.`,
      code: "cap_exceeded",
    };
  }

  const results: InviteResult[] = [];
  for (const email of cleaned) {
    if (existing.has(email)) {
      results.push({ email, status: "already_member" });
      continue;
    }
    const joinUrl = buildJoinUrl(SITE_URL, league.join_code, email);
    const sent = await sendInvitation(email, league.name, joinUrl);
    results.push({
      email,
      status: sent.ok ? "sent" : sent.skipped ? "link_only" : "failed",
      joinUrl,
    });
  }

  return {
    ok: true,
    data: {
      results,
      seatsRemaining: Math.max(0, cap - currentCount - newEmails.length),
    },
  };
}

const JoinSchema = z.object({
  code: z.string().min(1),
  email: z.string().email(),
  // Optional: present for signed email invites, empty for general shared links.
  sig: z.string().optional().default(""),
  displayName: z.string().trim().min(1, "Enter your name").max(80),
  // Optional creator/channel attribution from a ?ref= link.
  ref: z.string().trim().max(60).optional(),
});

/**
 * Join a league from a signed invite link: re-verify the HMAC signature, create
 * the member (within cap), and sign the user in for ongoing auth.
 */
export async function joinLeague(input: {
  code: string;
  email: string;
  sig: string;
  displayName: string;
  ref?: string;
}): Promise<ActionResult<{ leagueName: string }>> {
  const parsed = JoinSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      code: "invalid_input",
    };
  }
  const { code, sig, displayName, ref } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const referralSource = ref?.trim() || null;

  // Signed email invites must verify; general (unsigned) links are code-gated.
  if (sig && !verifyJoin(code, email, sig)) {
    return {
      ok: false,
      error: "This invite link is invalid or has been tampered with.",
      code: "bad_signature",
    };
  }

  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("*")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) {
    return { ok: false, error: "League not found.", code: "not_found" };
  }

  const { data: existingMember } = await admin
    .from("members")
    .select("id")
    .eq("league_id", league.id)
    .eq("email", email)
    .maybeSingle();

  if (existingMember) {
    await admin
      .from("members")
      .update({ display_name: displayName })
      .eq("id", existingMember.id);
  } else {
    const { count } = await admin
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("league_id", league.id);
    const { data: license } = await admin
      .from("licenses")
      .select("max_members")
      .eq("id", league.license_id)
      .maybeSingle();
    if ((count ?? 0) >= (license?.max_members ?? 0)) {
      return { ok: false, error: "This league is full.", code: "cap_reached" };
    }

    const { error } = await admin.from("members").insert({
      league_id: league.id,
      email,
      display_name: displayName,
      referral_source: referralSource,
    });
    if (error) {
      // DB cap trigger is the backstop; treat a unique-violation race as success.
      if (/cap/i.test(error.message)) {
        return { ok: false, error: "This league is full.", code: "cap_reached" };
      }
      if (!/duplicate|unique/i.test(error.message)) {
        return {
          ok: false,
          error: "Could not join the league. Please try again.",
          code: "join_failed",
        };
      }
    }
  }

  await signInWithEmail(email);
  return { ok: true, data: { leagueName: league.name } };
}
