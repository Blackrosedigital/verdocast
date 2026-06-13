import type { Metadata } from "next";
import Link from "next/link";
import { Faq, FAQ_ITEMS } from "@/components/marketing/faq";
import { Button } from "@/components/ui/button";
import { GROUP_COLOR_LIST, TOURNAMENT } from "@/lib/brand";
import { PRICING_TIERS } from "@/lib/pricing";
import { DEFAULT_RULES } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Verdocast - Run a World Cup 2026 prediction league in 5 minutes",
  description:
    "Free for the group stage: share a link and let your office, mates, or group predict every World Cup 2026 match. Automatic scoring and a live leaderboard. Set up in five minutes.",
  alternates: { canonical: "/" },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STEPS = [
  {
    title: "Start free",
    body: "Create your league in two minutes. Free for the group stage - no card, no subscription, no IT ticket.",
  },
  {
    title: "Share link",
    body: "Name your league and share the join link. Everyone joins with a magic link - no passwords.",
  },
  {
    title: "Watch leaderboard",
    body: "Everyone predicts all 72 group matches. Scores update automatically and the leaderboard goes live.",
  },
];

// Scoring tiers shown on the landing page. Points come from lib/scoring.ts
// (DEFAULT_RULES) so the page can never drift from the engine.
const SCORING = [
  {
    points: DEFAULT_RULES.exact,
    label: "Exact score",
    body: "You call the precise scoreline.",
    example: "Predict 2-1, it ends 2-1",
    color: "var(--gold)",
  },
  {
    points: DEFAULT_RULES.goal_diff,
    label: "Goal difference",
    body: "Right margin, wrong score (non-draws).",
    example: "Predict 2-1, it ends 3-2",
    color: "var(--accent)",
  },
  {
    points: DEFAULT_RULES.result,
    label: "Correct result",
    body: "Right winner, or you called the draw.",
    example: "Predict 1-0, it ends 3-1",
    color: "var(--foreground)",
  },
  {
    points: 0,
    label: "Anything else",
    body: "Wrong result - no points this time.",
    example: "Predict 1-0, it ends 0-2",
    color: "var(--muted-foreground)",
  },
];

function StructuredData() {
  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Verdocast",
      url: SITE_URL,
      description:
        "World Cup 2026 prediction leagues for offices, friends, and groups.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Verdocast World Cup 2026 Predictor",
      description:
        "Run a World Cup 2026 prediction league for your office, mates, or group. Automatic scoring and a live leaderboard.",
      brand: { "@type": "Brand", name: "Verdocast" },
      offers: PRICING_TIERS.map((tier) => ({
        "@type": "Offer",
        name: `${tier.name} (free for the group stage)`,
        price: "0.00",
        priceCurrency: "GBP",
        url: `${SITE_URL}/start`,
        availability: "https://schema.org/InStock",
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function LandingPage() {
  return (
    <>
      <StructuredData />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {TOURNAMENT.name} · kicks off {TOURNAMENT.startLabel}
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-6xl leading-[0.95] tracking-wide text-foreground sm:text-8xl">
          Run a World Cup 2026 prediction league in 5 minutes
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Verdocast turns the tournament into a competition for your office, your
          mates, or the group chat. Create a free league, share a link, and watch
          the banter - and the leaderboard - take over.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/start">Start free</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/demo">Try the demo</Link>
          </Button>
        </div>
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-primary">
          Free for the group stage · no card needed
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Not ready to set one up?{" "}
          <Link href="/play" className="text-primary underline">
            Join the Verdocast Global League →
          </Link>
        </p>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16"
      >
        <h2 className="text-center font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          Three steps to kickoff
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border bg-surface p-8"
            >
              <div
                className="flex size-10 items-center justify-center rounded-full font-display text-2xl text-black"
                style={{ backgroundColor: GROUP_COLOR_LIST[i] }}
              >
                {i + 1}
              </div>
              <h3 className="mt-5 font-display text-2xl tracking-wide text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How points work */}
      <section id="scoring" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
            How points work
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Predict the exact score of every match. The closer you get, the more
            you score - so nobody&rsquo;s ever out of it until the final whistle.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCORING.map((tier) => (
            <div
              key={tier.label}
              className="rounded-2xl border border-border bg-surface p-6 text-center"
            >
              <p
                className="font-display text-6xl leading-none"
                style={{ color: tier.color }}
              >
                {tier.points}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {tier.points === 1 ? "point" : "points"}
              </p>
              <h3 className="mt-4 font-display text-xl tracking-wide text-foreground">
                {tier.label}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{tier.body}</p>
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                {tier.example}
              </p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-center text-sm text-muted-foreground">
          So if a match ends{" "}
          <span className="font-mono text-foreground">2-1</span>: predicting{" "}
          <span className="font-mono text-foreground">2-1</span> earns{" "}
          {DEFAULT_RULES.exact}, <span className="font-mono text-foreground">3-2</span>{" "}
          earns {DEFAULT_RULES.goal_diff} (right margin), and{" "}
          <span className="font-mono text-foreground">1-0</span> earns{" "}
          {DEFAULT_RULES.result} (right winner).
        </p>
      </section>

      {/* Pricing summary */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
            Free for the group stage
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Every company and group plays free through the group stage. Pick the
            size that fits you.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="rounded-2xl border border-border bg-surface p-6 text-center"
            >
              <h3 className="font-display text-2xl tracking-wide text-foreground">
                {tier.name}
              </h3>
              <p className="mt-3 font-display text-4xl text-primary">Free</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Up to {tier.max_members.toLocaleString("en-GB")} members
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/start">Start free</Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-16">
        <h2 className="mb-8 text-center font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          Frequently asked
        </h2>
        <Faq />
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 text-center">
        <div className="rounded-3xl border border-border bg-surface px-6 py-14">
          <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
            Ready before the first whistle?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Set up your free league today and have it waiting in everyone&rsquo;s
            inbox before {TOURNAMENT.startLabel}.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/start">Start free</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
