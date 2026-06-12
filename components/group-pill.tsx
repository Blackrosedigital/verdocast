import { GROUP_COLORS } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Small group-letter chip in the group's colour (A-L). Presentational. */
export function GroupPill({
  letter,
  className,
}: {
  letter: string | null;
  className?: string;
}) {
  const color = (letter && GROUP_COLORS[letter]) || "var(--border-strong)";
  return (
    <span
      title={letter ? `Group ${letter}` : undefined}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded font-display text-xs text-black sm:size-7 sm:text-sm",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {letter ?? "?"}
    </span>
  );
}
