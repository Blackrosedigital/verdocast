import { AppNav, type NavLink } from "@/components/app-nav";
import { getUser, isSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // League-specific actions live on each league's dashboard, so the global nav
  // stays league-agnostic — supports owners running multiple leagues.
  const links: NavLink[] = [{ href: "/admin", label: "My leagues" }];
  if (isSuperAdmin(user?.email)) {
    links.push({ href: "/admin/stats", label: "Stats" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav links={links} homeHref="/admin" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
