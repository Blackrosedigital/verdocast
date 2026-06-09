import { NextResponse } from "next/server";
import { ingestResults } from "@/jobs/ingest-results";

// Always run fresh; never cached.
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  const summary = await ingestResults();
  return NextResponse.json(summary);
}

// Vercel Cron invokes via GET; allow POST for manual triggers too.
export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
