import { AppNav, type NavLink } from "@/components/app-nav";
import { getUser, isSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve the admin's primary league so the tabs deep-link correctly.
  let slug: string | null = null;
  const user = await getUser();
  if (user?.email) {
    const admin = createAdminClient();
    const { data: org } = await admin
      .from("organizations")
      .select("id")
      .eq("owner_email", user.email)
      .order("created_at", { ascending: true })
      .limit(1)
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
      slug = league?.slug ?? null;
    }
  }

  const links: NavLink[] = slug
    ? [
        { href: `/admin/league/${slug}`, label: "Dashboard" },
        { href: `/admin/league/${slug}/invite`, label: "Invite" },
      ]
    : [{ href: "/admin", label: "Dashboard" }];

  if (isSuperAdmin(user?.email)) {
    links.push({ href: "/admin/stats", label: "Stats" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav links={links} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
