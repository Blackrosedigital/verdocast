import { NextResponse } from "next/server";
import { sendMatchdayReminders } from "@/jobs/send-matchday-reminders";

/**
 * Matchday reminder cron. Same auth as /api/ingest/results: a bearer
 * CRON_SECRET, since this one sends real email and must not be triggerable by
 * anyone who finds the URL.
 *
 * `?dry=1` reports who WOULD be emailed without sending or recording
 * anything — the safe way to inspect a window before a real run.
 */
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const windowParam = url.searchParams.get("window");
  const windowHours = windowParam ? Number(windowParam) : undefined;

  const summary = await sendMatchdayReminders({
    dryRun,
    windowHours:
      windowHours != null && Number.isFinite(windowHours) && windowHours > 0
        ? windowHours
        : undefined,
  });

  return NextResponse.json({ ...summary, dryRun });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
