import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signs league join links so the `email` query param can't be tampered with.
 * Server-only (uses JOIN_LINK_SECRET + node:crypto). Never import client-side.
 */

function getSecret(): string {
  const secret = process.env.JOIN_LINK_SECRET;
  if (!secret) throw new Error("JOIN_LINK_SECRET is not set");
  return secret;
}

/** Normalise so signing and membership use the same canonical email. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** HMAC-SHA256 of "joinCode:email" as hex. */
export function signJoin(joinCode: string, email: string): string {
  return createHmac("sha256", getSecret())
    .update(`${joinCode}:${normalizeEmail(email)}`)
    .digest("hex");
}

/** Constant-time verification of a join signature. */
export function verifyJoin(
  joinCode: string,
  email: string,
  sig: string | null | undefined,
): boolean {
  if (!sig) return false;
  let expected: string;
  try {
    expected = signJoin(joinCode, email);
  } catch {
    return false;
  }
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Build the full signed join URL for an invitee. */
export function buildJoinUrl(
  siteUrl: string,
  joinCode: string,
  email: string,
): string {
  const normalized = normalizeEmail(email);
  const sig = signJoin(joinCode, normalized);
  return `${siteUrl}/league/${joinCode}/join?email=${encodeURIComponent(normalized)}&sig=${sig}`;
}
