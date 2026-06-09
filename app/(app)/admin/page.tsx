import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Admin index: send a signed-in admin to their (first) league dashboard.
 * Lands here after magic-link sign-in (/auth/callback?next=/admin).
 */
export default async function AdminIndexPage() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_email", user.email ?? "")
    .maybeSingle();

  if (org) {
    const { data: league } = await admin
      .from("leagues")
      .select("slug")
      .eq("organization_id", org.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (league) redirect(`/admin/league/${league.slug}`);
  }

  // Signed in but no league to administer.
  redirect("/");
}
