import Link from "next/link";

// Group stage runs to 27 Jun; knockouts (R32) begin 28 Jun; final 19 Jul.
const KNOCKOUT_START = new Date("2026-06-28T00:00:00Z");
const TOURNAMENT_END = new Date("2026-07-19T23:59:59Z");
const DAY = 86_400_000;

/**
 * Heads-up banner for the admin dashboard: counts down to the knockouts, then
 * flips to "live" once they start. Returns null after the tournament. Drives the
 * group-stage -> knockout activation funnel.
 */
export function KnockoutCountdown({ billingHref }: { billingHref?: string }) {
  const now = Date.now();
  if (now > TOURNAMENT_END.getTime()) return null;

  const live = now >= KNOCKOUT_START.getTime();
  const days = Math.max(0, Math.ceil((KNOCKOUT_START.getTime() - now) / DAY));

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-5 py-3">
      <p className="flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className="inline-block size-2 shrink-0 rounded-full"
          style={{ backgroundColor: "var(--gold)" }}
        />
        {live ? (
          <span className="text-foreground">
            <span className="font-display tracking-wide">The knockouts are live.</span>{" "}
            <span className="text-muted-foreground">
              Keep your league playing all the way to the final.
            </span>
          </span>
        ) : (
          <span className="text-foreground">
            <span className="font-display tracking-wide">
              Knockouts kick off 28 Jun
            </span>{" "}
            <span className="text-muted-foreground">
              · {days} day{days === 1 ? "" : "s"} to go. Get your team predicting
              now so they&rsquo;re hooked for the run-in.
            </span>
          </span>
        )}
      </p>
      {live && billingHref && (
        <Link
          href={billingHref}
          className="shrink-0 text-sm font-medium text-primary underline"
        >
          Manage billing
        </Link>
      )}
    </div>
  );
}
