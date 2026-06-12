import { AppNav } from "@/components/app-nav";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav
        links={[
          { href: `/league/${code}/predict`, label: "Predictions" },
          { href: `/league/${code}/leaderboard`, label: "Leaderboard" },
        ]}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
