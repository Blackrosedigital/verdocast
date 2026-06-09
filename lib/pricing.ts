/**
 * Single source of truth for B2B pricing tiers.
 *
 * Pure data — NO env access here, so this module is safe to import from both
 * server and client components. The live Stripe price id (if any) is resolved
 * server-side in lib/checkout.ts via the STRIPE_PRICE_<ID> env convention;
 * otherwise checkout falls back to inline price_data built from `price_pence`.
 */

export type TierId = "starter" | "pro" | "team";

export interface PricingTier {
  id: TierId;
  name: string;
  /** One-time price in pence (GBP). */
  price_pence: number;
  /** License member cap. */
  max_members: number;
  tagline: string;
  marketing_features: string[];
  /** Visually emphasised tier on the pricing page. */
  highlighted?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price_pence: 19900,
    max_members: 50,
    tagline: "Small teams and single offices.",
    marketing_features: [
      "Up to 50 members",
      "All 72 group-stage matches",
      "Live leaderboard",
      "Shareable join link",
      "Email invitations",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price_pence: 49900,
    max_members: 250,
    tagline: "Growing companies that want the buzz.",
    marketing_features: [
      "Up to 250 members",
      "Everything in Starter",
      "Admin dashboard & analytics",
      "Priority email support",
    ],
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    price_pence: 99900,
    max_members: 1000,
    tagline: "Large organisations, multiple departments.",
    marketing_features: [
      "Up to 1,000 members",
      "Everything in Pro",
      "Multiple leagues per org",
      "Onboarding help",
    ],
  },
];

export const ENTERPRISE = {
  name: "Enterprise",
  price_label: "From £2,500",
  contact_email: "sales@verdocast.com",
  tagline: "5,000+ employees, custom scoring, SSO.",
  marketing_features: [
    "Unlimited members",
    "Custom scoring rules",
    "League branding",
    "Dedicated support & SLA",
  ],
} as const;

export function getTier(id: string): PricingTier | undefined {
  return PRICING_TIERS.find((t) => t.id === id);
}

/** Format pence as a clean GBP string, e.g. 19900 -> "£199". */
export function formatGBP(pence: number): string {
  const pounds = pence / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pounds % 1 === 0 ? 0 : 2,
  }).format(pounds);
}
