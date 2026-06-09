import { GROUP_COLOR_LIST } from "@/lib/brand";

/** Thin 12-segment bar in the WC2026 group colours. Decorative. */
export function GroupStrip({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="flex h-1.5 w-full overflow-hidden">
        {GROUP_COLOR_LIST.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}
