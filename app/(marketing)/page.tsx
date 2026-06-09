import type { Metadata } from "next";
import Link from "next/link";
import { Faq, FAQ_ITEMS } from "@/components/marketing/faq";
import { Button } from "@/components/ui/button";
import { GROUP_COLOR_LIST, TOURNAMENT } from "@/lib/brand";
import { formatGBP, PRICING_TIERS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Verdocast — Run your office World Cup 2026 predictor in 5 minutes",
  description:
    "Buy a license, share a link, and let your employees predict every World Cup 2026 match. Automatic scoring and a live leaderboard. Set up in five minutes.",
  alternates: { canonical: "/" },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STEPS = [
  {
    title: "Buy",
    body: "Pick a plan and pay once with card. No subscriptions, no per-seat billing, no IT ticket.",
  },
  {
    title: "Share link",
    body: "Name your league and share the join link. Employees join with a magic link — no passwords.",
  },
  {
    title: "Watch leaderboard",
    body: "Everyone predicts all 72 group matches. Scores update automatically and the leaderboard goes live.",
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
        "B2B World Cup 2026 prediction leagues for companies and their employees.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Verdocast Office World Cup 2026 Predictor",
      description:
        "Run a World Cup 2026 prediction league for your employees. Automatic scoring and a live leaderboard.",
      brand: { "@type": "Brand", name: "Verdocast" },
      offers: PRICING_TIERS.map((tier) => ({
        "@type": "Offer",
        name: tier.name,
        price: (tier.price_pence / 100).toFixed(2),
        priceCurrency: "GBP",
        url: `${SITE_URL}/pricing`,
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
          Run your office&rsquo;s World Cup 2026 predictor in 5 minutes
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Verdocast turns the tournament into an office-wide competition. Buy
          once, share a link, and watch the banter — and the leaderboard — take
          over.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/pricing">See plans &amp; pricing</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="#how-it-works">How it works</Link>
          </Button>
        </div>
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

      {/* Pricing summary */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
            One-time pricing, no surprises
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Pay once for the whole tournament. Pick the size that fits your
            company.
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
              <p className="mt-3 font-display text-4xl text-foreground">
                {formatGBP(tier.price_pence)}
              </p>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Up to {tier.max_members.toLocaleString("en-GB")} members
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/pricing">View full pricing</Link>
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
            Set up your league today and have it waiting in everyone&rsquo;s
            inbox before {TOURNAMENT.startLabel}.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/pricing">Get started</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
