/**
 * Error capture. A thin interface so call sites are Sentry-ready: when a
 * SENTRY_DSN is configured and @sentry/nextjs is wired (see docs/runbook.md),
 * forward here; until then it logs server-side. Never logs sensitive payloads —
 * pass only safe context (CLAUDE.md).
 */
export function captureException(
  error: unknown,
  context?: Record<string, string>,
): void {
  // TODO(runbook): forward to Sentry.captureException once DSN is set.
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error("[error]", message, context ?? {});
}
