import type { Metadata } from "next";
import { Check } from "lucide-react";
import { CanceledBanner } from "@/components/marketing/canceled-banner";
import { PricingCard } from "@/components/pricing-card";
import { Button } from "@/components/ui/button";
import { ENTERPRISE, PRICING_TIERS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing - Verdocast Office World Cup 2026 Predictor",
  description:
    "Free for the group stage. Run a World Cup 2026 prediction league for your office or group - no card needed. Knockout pricing announced later.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full border border-primary bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">
          🎉 Free for the group stage
        </span>
        <h1 className="mt-5 font-display text-5xl tracking-wide text-foreground sm:text-6xl">
          Start free. Pay later, if you love it.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The whole group stage is free for every company and group. The tiers
          below are what we&rsquo;ll offer for the knockout rounds - no card
          needed today.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <CanceledBanner />
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        {PRICING_TIERS.map((tier) => (
          <PricingCard key={tier.id} tier={tier} ctaHref="/start" />
        ))}
      </div>

      {/* Enterprise contact tile */}
      <div className="mt-6 rounded-2xl border border-border-strong bg-surface-2 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-3xl tracking-wide text-foreground">
                {ENTERPRISE.name}
              </h2>
              <span className="font-mono text-sm text-gold">
                {ENTERPRISE.price_label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {ENTERPRISE.tagline}
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {ENTERPRISE.marketing_features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="shrink-0">
            <Button asChild size="lg" variant="outline">
              <a
                href={`mailto:${ENTERPRISE.contact_email}?subject=Verdocast%20Enterprise%20enquiry`}
              >
                Contact sales
              </a>
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Prices in GBP and exclude VAT. Includes the full World Cup 2026 group
        stage. Knockout predictions coming in a later update.
      </p>
    </div>
  );
}
