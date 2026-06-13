"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export type ActionResult =
  | { ok: true; data: { displayName: string } }
  | { ok: false; error: string; code: string };

const Schema = z.object({
  code: z.string().min(1),
  displayName: z.string().trim().min(1, "Enter your name").max(80),
});

/**
 * Change the signed-in user's display name within one league. Scoped to the
 * caller's own membership (matched on auth email), so a member can only rename
 * themselves — never another player.
 */
export async function updateDisplayName(input: {
  code: string;
  displayName: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      code: "invalid_input",
    };
  }
  const { code, displayName } = parsed.data;

  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("id")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) return { ok: false, error: "League not found.", code: "not_found" };

  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("league_id", league.id)
    .eq("email", user.email ?? "")
    .maybeSingle();
  if (!member) {
    return {
      ok: false,
      error: "You’re not a member of this league.",
      code: "not_member",
    };
  }

  const { error } = await admin
    .from("members")
    .update({ display_name: displayName })
    .eq("id", member.id);
  if (error) {
    return { ok: false, error: "Could not update your name.", code: "save_failed" };
  }
  return { ok: true, data: { displayName } };
}

const AdminSchema = z.object({
  slug: z.string().min(1),
  memberId: z.string().uuid(),
  displayName: z.string().trim().min(1, "Enter a name").max(80),
});

/**
 * Rename any member of a league. Owner-only: verifies the caller owns the
 * league's organization, and that the target member belongs to that league.
 */
export async function adminUpdateMemberName(input: {
  slug: string;
  memberId: string;
  displayName: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = AdminSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      code: "invalid_input",
    };
  }
  const { slug, memberId, displayName } = parsed.data;

  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("id, organization_id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) return { ok: false, error: "League not found.", code: "not_found" };

  const { data: org } = await admin
    .from("organizations")
    .select("owner_email")
    .eq("id", league.organization_id)
    .maybeSingle();
  if (!org || org.owner_email !== user.email) {
    return { ok: false, error: "You don’t own this league.", code: "forbidden" };
  }

  const { error } = await admin
    .from("members")
    .update({ display_name: displayName })
    .eq("id", memberId)
    .eq("league_id", league.id);
  if (error) {
    return { ok: false, error: "Could not rename member.", code: "save_failed" };
  }
  return { ok: true, data: { displayName } };
}
