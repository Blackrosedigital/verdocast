"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Banner() {
  const params = useSearchParams();
  if (params.get("canceled") !== "1") return null;
  return (
    <div
      role="status"
      className="mb-8 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground"
    >
      Checkout canceled — no charge was made. Pick a plan whenever you’re ready.
    </div>
  );
}

/**
 * Shows a "checkout canceled" notice when ?canceled=1 is present. Reads the
 * query client-side (wrapped in Suspense) so the pricing page stays static.
 */
export function CanceledBanner() {
  return (
    <Suspense fallback={null}>
      <Banner />
    </Suspense>
  );
}
