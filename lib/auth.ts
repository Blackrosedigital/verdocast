import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createAdminClient, createClient } from "@/lib/db";

/** Current authenticated user, or null. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Require an authenticated user; redirect home if there isn't one. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/");
  return user;
}

/**
 * Require an admin. In v1 every authenticated user is the admin of the org(s)
 * they own; per-org authorization is hardened with RLS in PR 9.
 */
export async function requireAdmin(): Promise<User> {
  return requireUser();
}

/**
 * Site super-admin (you) — for the private stats dashboard. Set
 * SUPERADMIN_EMAILS (comma-separated); falls back to the founder email.
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  const list = (
    process.env.SUPERADMIN_EMAILS ??
    "christopher@emtech.com,christophermensah@gmail.com"
  )
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

/**
 * Establish a Supabase session for `email` server-side (no email round-trip):
 * ensure the user exists, mint a magic-link token with the service role, then
 * verify it on the cookie client to set the session. MUST be called from a
 * Server Action / Route Handler (it writes cookies). Returns success.
 */
export async function signInWithEmail(email: string): Promise<boolean> {
  const admin = createAdminClient();

  // Idempotently ensure the auth user exists (ignore "already registered").
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createError && !/registered|exists|already/i.test(createError.message)) {
    return false;
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return false;

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  return !verifyError;
}
