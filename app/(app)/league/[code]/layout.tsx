import { AppNav } from "@/components/app-nav";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Carry the league's brand accent into the nav for a consistent look.
  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("brand_color")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav
        brandColor={league?.brand_color ?? null}
        homeHref="/leagues"
        links={[
          { href: "/leagues", label: "My leagues" },
          { href: `/league/${code}/predict`, label: "Predictions" },
          { href: `/league/${code}/leaderboard`, label: "Leaderboard" },
        ]}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
