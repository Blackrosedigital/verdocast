"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Horizontal-scroll wrapper for the bracket with left/right chevron affordances
 * that appear only when there's more to scroll (like the round-header arrow).
 */
export function BracketScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function update() {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function nudge(dir: 1 | -1) {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  const btn =
    "absolute top-1 z-10 flex size-9 items-center justify-center rounded-full border border-border bg-[rgba(20,22,26,0.92)] text-xl leading-none text-foreground backdrop-blur transition-colors hover:border-border-strong";

  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className="overflow-x-auto pb-3">
        {children}
      </div>
      {canLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => nudge(-1)}
          className={`${btn} left-1`}
        >
          ‹
        </button>
      )}
      {canRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => nudge(1)}
          className={`${btn} right-1`}
        >
          ›
        </button>
      )}
    </div>
  );
}
