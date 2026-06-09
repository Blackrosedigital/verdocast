/**
 * Placeholder home page (PR 1). The real marketing surface lands in PR 4 under
 * app/(marketing)/page.tsx — this just proves the stack boots and is themed.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        World Cup 2026 · 11 Jun – 19 Jul
      </span>

      <h1 className="font-display text-7xl tracking-wide text-foreground sm:text-8xl">
        Verdo<span className="text-primary">cast</span>
      </h1>

      <p className="max-w-md text-balance text-lg text-muted-foreground">
        Forecast every match. Settle every debate. The office World Cup
        predictor, sorted in five minutes.
      </p>

      <p className="font-mono text-xs text-muted-foreground">
        Scaffold ready — PR&nbsp;1 complete.
      </p>
    </main>
  );
}
