import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Server-side Supabase client for Server Components / Route Handlers.
 *
 * Uses @supabase/ssr cookie-based auth (anon key + RLS). `next/headers` is
 * imported lazily so this module stays importable outside a Next request
 * context (e.g. in unit tests that only need the admin client below).
 */
export async function createClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. Safe to ignore when middleware refreshes sessions.
          }
        },
      },
    },
  );
}

/**
 * Service-role Supabase client. Bypasses Row-Level Security.
 *
 * SERVER-ONLY — use from Server Actions, cron jobs, and tests. Never import
 * this into a Client Component (CLAUDE.md: the service role key must never
 * reach the browser).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
