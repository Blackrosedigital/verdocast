import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InviteForm } from "@/components/admin/invite-form";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: league } = await admin
    .from("leagues")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) notFound();

  const { data: org } = await admin
    .from("organizations")
    .select("owner_email")
    .eq("id", league.organization_id)
    .maybeSingle();
  if (org?.owner_email && user.email !== org.owner_email) {
    redirect("/");
  }

  const { data: license } = await admin
    .from("licenses")
    .select("max_members")
    .eq("id", league.license_id)
    .maybeSingle();
  const { count } = await admin
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);

  const cap = license?.max_members ?? 0;
  const seatsRemaining = Math.max(0, cap - (count ?? 0));

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href={`/admin/league/${slug}`}
        className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← {league.name}
      </Link>
      <h1 className="mt-3 font-display text-5xl tracking-wide text-foreground">
        Invite your team
      </h1>
      <p className="mt-2 text-muted-foreground">
        Paste employee emails - one per line, or a comma/CSV paste. Each person
        gets a secure one-click join link.
      </p>

      <div className="mt-8">
        <InviteForm leagueId={league.id} seatsRemaining={seatsRemaining} />
      </div>
    </main>
  );
}
