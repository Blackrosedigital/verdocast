import { cn } from "@/lib/utils";

/**
 * Reinforces the core wedge vs real-money prediction apps (e.g. ADI
 * Predictstreet): Verdocast is a free skill game, not gambling. Placed on the
 * landing, join and pricing pages.
 */
export function TrustLine({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
      <span className="text-foreground">Free to play</span>
      <span aria-hidden="true">·</span>
      <span className="text-foreground">No money</span>
      <span aria-hidden="true">·</span>
      <span className="text-foreground">Not gambling</span>
    </p>
  );
}
