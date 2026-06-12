import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";

/** Sign the user out and return home. POSTed from the app nav. */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
