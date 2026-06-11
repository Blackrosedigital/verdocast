import Link from "next/link";
import { Check } from "lucide-react";
import { CheckoutButton } from "@/components/marketing/checkout-button";
import { Button } from "@/components/ui/button";
import { formatGBP, type PricingTier } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function PricingCard({
  tier,
  ctaHref,
}: {
  tier: PricingTier;
  /** When set, the card links here (free launch) instead of Stripe checkout. */
  ctaHref?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-surface p-8",
        tier.highlighted
          ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
          : "border-border",
      )}
    >
      {tier.highlighted && (
        <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
          Most popular
        </span>
      )}

      <h3 className="font-display text-3xl tracking-wide text-foreground">
        {tier.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl text-foreground">
          {formatGBP(tier.price_pence)}
        </span>
        <span className="text-sm text-muted-foreground">one-time</span>
      </div>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Up to {tier.max_members.toLocaleString("en-GB")} members
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {tier.marketing_features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {ctaHref ? (
          <Button
            asChild
            variant={tier.highlighted ? "default" : "secondary"}
            className="w-full"
          >
            <Link href={ctaHref}>Start free</Link>
          </Button>
        ) : (
          <CheckoutButton
            tierId={tier.id}
            variant={tier.highlighted ? "default" : "secondary"}
          >
            Buy {tier.name}
          </CheckoutButton>
        )}
      </div>
    </div>
  );
}
