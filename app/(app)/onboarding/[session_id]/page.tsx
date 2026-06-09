import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Placeholder post-checkout landing (PR 4). Stripe's success_url redirects here
 * with the Checkout Session id. PR 5 turns this into the real onboarding wizard
 * (create org + license, name the first league). For now it just confirms the
 * session id so the payment round-trip is verifiable end to end.
 */
export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Payment received
      </span>
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        You&rsquo;re in.
      </h1>
      <p className="text-muted-foreground">
        Onboarding is coming next. Your Stripe Checkout session:
      </p>
      <code className="block w-full break-all rounded-lg border border-border bg-surface-2 px-4 py-3 font-mono text-sm text-foreground">
        {session_id}
      </code>
      <Button asChild variant="secondary">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
