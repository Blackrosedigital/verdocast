import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { JoinForm } from "@/components/league/join-form";
import { createAdminClient } from "@/lib/db";
import { normalizeEmail, verifyJoin } from "@/lib/sign-url";

export const dynamic = "force-dynamic";

/**
 * Join landing. Two ways in:
 *  - Signed email invite (?email=&sig=): email is verified + locked.
 *  - General shared link (no sig): anyone with the league code self-joins.
 * A signature that's PRESENT but wrong is treated as tampering. `?ref=` is
 * captured for creator/channel attribution. League branding (colour + logo) is
 * applied when set.
 */
export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string; sig?: string; ref?: string }>;
}) {
  const { code } = await params;
  const { email: rawEmail, sig, ref } = await searchParams;

  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("name, join_code, brand_color, brand_logo_url")
    .eq("join_code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!league) notFound();

  const email = rawEmail ? normalizeEmail(rawEmail) : "";
  const signedValid = Boolean(email && sig && verifyJoin(code, email, sig));
  const tampered = Boolean(sig) && !signedValid;

  // Brand accent overrides --primary for this page when the league sets one.
  const brandStyle = league.brand_color
    ? ({ "--primary": league.brand_color } as CSSProperties)
    : undefined;

  return (
    <main
      style={brandStyle}
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16"
    >
      <div className="text-center">
        {league.brand_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={league.brand_logo_url}
            alt={league.name}
            className="mx-auto mb-4 h-16 w-auto object-contain"
          />
        ) : (
          <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            World Cup 2026 Predictor
          </span>
        )}
        <h1 className="mt-5 font-display text-5xl tracking-wide text-foreground">
          {league.name}
        </h1>
      </div>

      {tampered ? (
        <div className="max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            This invite link isn&rsquo;t valid
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The link may be incomplete or have been altered. Ask your league
            admin to resend your invitation.
          </p>
        </div>
      ) : (
        <JoinForm
          code={code}
          email={email}
          sig={sig ?? ""}
          emailLocked={signedValid}
          leagueName={league.name}
          referral={ref ?? ""}
        />
      )}
    </main>
  );
}
