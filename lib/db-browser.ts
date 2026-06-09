import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/db";

/**
 * Browser-side Supabase client for Client Components.
 *
 * Uses the public anon key (inlined at build time) + RLS. Never use the
 * service role key here — it would be shipped to the browser.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
