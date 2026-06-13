"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; code: string };

const Schema = z.object({
  slug: z.string().min(1),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #e6ff3d")
    .or(z.literal("")),
  brandLogoUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .or(z.literal("")),
});

/** Set a league's brand colour + logo. Owner-only. */
export async function updateLeagueBranding(input: {
  slug: string;
  brandColor: string;
  brandLogoUrl: string;
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
  const { slug, brandColor, brandLogoUrl } = parsed.data;

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
    .from("leagues")
    .update({
      brand_color: brandColor || null,
      brand_logo_url: brandLogoUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", league.id);
  if (error) {
    return { ok: false, error: "Could not save branding.", code: "save_failed" };
  }
  return { ok: true };
}
