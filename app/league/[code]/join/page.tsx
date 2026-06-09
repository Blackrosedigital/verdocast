import { notFound } from "next/navigation";
import { JoinForm } from "@/components/league/join-form";
import { createAdminClient } from "@/lib/db";
import { normalizeEmail, verifyJoin } from "@/lib/sign-url";

export const dynamic = "force-dynamic";

/**
 * Signed invite landing. Validates the HMAC signature server-side; only renders
 * the join form when the email+signature are intact. The action re-verifies.
 */
export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string; sig?: string }>;
}) {
  const { code } = await params;
  const { email: rawEmail, sig } = await searchParams;

  const admin = createAdminClient();
  const { data: league } = await admin
    .from("leagues")
    .select("name, join_code")
    .eq("join_code", code)
    .maybeSingle();
  if (!league) notFound();

  const email = rawEmail ? normalizeEmail(rawEmail) : "";
  const valid = Boolean(email && sig && verifyJoin(code, email, sig));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          World Cup 2026 Predictor
        </span>
        <h1 className="mt-5 font-display text-5xl tracking-wide text-foreground">
          {league.name}
        </h1>
      </div>

      {valid ? (
        <JoinForm code={code} email={email} sig={sig!} leagueName={league.name} />
      ) : (
        <div className="max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            This invite link isn&rsquo;t valid
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The link may be incomplete or have been altered. Ask your league
            admin to resend your invitation.
          </p>
        </div>
      )}
    </main>
  );
}
