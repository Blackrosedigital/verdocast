import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandingForm } from "@/components/admin/branding-form";
import { JoinLink } from "@/components/admin/join-link";
import { MemberRoster } from "@/components/admin/member-roster";
import { MembersList } from "@/components/admin/members-list";
import { NudgeButton } from "@/components/admin/nudge-button";
import { KnockoutCountdown } from "@/components/knockout-countdown";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { isSuperAdmin, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { predictionCountsByMember } from "@/lib/member-stats";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Group stage is free; billing (knockout tiers) surfaces from R32 onward.
const BILLING_VISIBLE_FROM = new Date("2026-06-28T00:00:00Z");

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default async function AdminLeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const { welcome } = await searchParams;
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
    .select("name, owner_email")
    .eq("id", league.organization_id)
    .maybeSingle();
  // Platform admins can view any league; league owners only their own.
  const superAdmin = isSuperAdmin(user.email);
  if (org?.owner_email && user.email !== org.owner_email && !superAdmin) {
    redirect("/");
  }

  const [licenseRes, membersRes, groupCountRes, topRes] = await Promise.all([
    admin.from("licenses").select("max_members").eq("id", league.license_id).maybeSingle(),
    admin
      .from("members")
      .select("id, display_name, email")
      .eq("league_id", league.id)
      .order("display_name", { ascending: true }),
    admin
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("stage", "group"),
    admin
      .from("leaderboard")
      .select("member_id, display_name, total_points, exact_scores")
      .eq("league_id", league.id)
      .order("total_points", { ascending: false })
      .order("exact_scores", { ascending: false })
      .limit(5),
  ]);

  const cap = licenseRes.data?.max_members ?? 0;
  const memberRows = membersRes.data ?? [];
  const memberIds = memberRows.map((m) => m.id);
  const memberCount = memberIds.length;
  // Member emails + rename are platform-admin-only (privacy): never exposed to
  // league owners.
  const members = superAdmin
    ? memberRows.map((m) => ({
        id: m.id,
        displayName: m.display_name ?? "",
        email: m.email,
      }))
    : [];
  const groupCount = groupCountRes.count ?? 0;

  const counts = await predictionCountsByMember(admin, memberIds);
  let predictionsMade = 0;
  for (const n of counts.values()) predictionsMade += n;
  const possible = memberCount * groupCount;
  const completion = possible > 0 ? Math.round((predictionsMade / possible) * 100) : 0;

  const joinUrl = `${SITE_URL}/league/${league.join_code}/join`;
  const predictUrl = `/league/${league.join_code}/predict`;
  const leaderboardUrl = `/league/${league.join_code}/leaderboard`;
  const top = topRes.data ?? [];

  // First-run setup checklist — ticks off from live data so a new admin always
  // knows the next step.
  const ownerEmail = (org?.owner_email ?? user.email ?? "").toLowerCase();
  const ownerMember = memberRows.find(
    (m) => m.email.toLowerCase() === ownerEmail,
  );
  const ownerPredicted = ownerMember
    ? (counts.get(ownerMember.id) ?? 0) > 0
    : false;

  // Privacy-safe roster (no emails) for owners; remove + nudge run through
  // owner-or-platform-admin server actions.
  const roster = memberRows.map((m) => ({
    id: m.id,
    displayName: m.display_name ?? "(no name)",
    predictions: counts.get(m.id) ?? 0,
    isOwner: m.id === ownerMember?.id,
  }));
  const nonPredictorCount = roster.filter(
    (m) => !m.isOwner && m.predictions === 0,
  ).length;

  const setupSteps = [
    { label: "Create your league", done: true, href: null, cta: null },
    {
      label: "Make your predictions",
      done: ownerPredicted,
      href: predictUrl,
      cta: "Predict",
    },
    {
      label: "Invite your team",
      done: memberCount > 1,
      href: `/admin/league/${slug}/invite`,
      cta: "Invite",
    },
  ];
  const allSet = setupSteps.every((s) => s.done);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {org?.name ?? "Your organization"} · Admin
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
          {league.name}
        </h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={predictUrl}>Make predictions</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={leaderboardUrl}>Leaderboard</Link>
          </Button>
          {new Date() >= BILLING_VISIBLE_FROM && (
            <Link
              href="/admin/billing"
              className="shrink-0 text-sm text-muted-foreground underline hover:text-foreground"
            >
              Billing
            </Link>
          )}
        </div>
      </div>{/* billing link hidden during the free group stage */}

      <KnockoutCountdown billingHref="/admin/billing" />

      {/* First-run setup checklist (hidden once the league is up and running) */}
      {!allSet && (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            {welcome ? "Your league is live 🎉" : "Get your league going"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A couple of quick steps and you&rsquo;re off.
          </p>
          <ol className="mt-4 space-y-3">
            {setupSteps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-3">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                    step.done
                      ? "bg-primary text-black"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </span>
                <span
                  className={
                    step.done
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }
                >
                  {step.label}
                </span>
                {!step.done && step.href && (
                  <Button asChild size="sm" className="ml-auto">
                    <Link href={step.href}>{step.cta}</Link>
                  </Button>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Members"
          value={`${memberCount} / ${cap}`}
          sub={`${Math.max(0, cap - memberCount)} seats left`}
        />
        <Stat
          label="Predictions"
          value={`${completion}%`}
          sub={`${predictionsMade} of ${possible} made`}
        />
        <Stat label="Group matches" value={String(groupCount)} sub="to predict" />
      </div>

      {/* Top 5 */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            Top scorers
          </h2>
          <Link
            href={`/league/${league.join_code}/leaderboard`}
            className="text-sm text-primary underline"
          >
            Full leaderboard
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No members yet - invite your team to get started.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {top.map((r, i) => (
              <li
                key={r.member_id}
                className="flex items-center gap-3 text-sm"
              >
                <span className="w-5 font-mono text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 text-foreground">{r.display_name}</span>
                <span className="font-mono text-primary">
                  {r.total_points ?? 0} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Invite */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          Invite your team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this link or the join code{" "}
          <span className="font-mono text-foreground">{league.join_code}</span>.
        </p>
        <div className="mt-4">
          <JoinLink joinUrl={joinUrl} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <ShareButton
            text={`Join my World Cup 2026 prediction league "${league.name}" on Verdocast 🏆 Free to play, two minutes to start:`}
            url={joinUrl}
            label="Copy invite message"
            variant="secondary"
          />
          <Button asChild>
            <Link href={`/admin/league/${slug}/invite`}>
              Invite by email
            </Link>
          </Button>
        </div>
      </div>

      {/* Members roster (owner + platform admin): names + progress + remove + nudge */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            Members
          </h2>
          <NudgeButton slug={slug} count={nonPredictorCount} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {memberCount} member{memberCount === 1 ? "" : "s"}
          {nonPredictorCount > 0
            ? ` · ${nonPredictorCount} haven’t predicted yet`
            : " · everyone’s predicting"}
          .
        </p>
        <MemberRoster slug={slug} members={roster} />
      </div>

      {/* Members - platform admins only (emails + rename are not shown to league owners) */}
      {superAdmin && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              Member emails
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Platform admin
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Emails + rename, visible to platform admins only.
          </p>
          <MembersList slug={slug} members={members} />
        </div>
      )}

      {/* Branding */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          League branding
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Make it yours — set an accent colour and logo shown on your league
          pages.
        </p>
        <div className="mt-4">
          <BrandingForm
            slug={slug}
            initialColor={league.brand_color ?? ""}
            initialLogo={league.brand_logo_url ?? ""}
          />
        </div>
      </div>
    </main>
  );
}
