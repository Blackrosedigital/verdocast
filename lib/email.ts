import { render } from "@react-email/render";
import { Resend } from "resend";
import { InvitationEmail } from "@/emails/invitation";

/**
 * Resend client + typed senders. Server-only.
 *
 * Degrades gracefully: if RESEND_API_KEY is unset we don't throw — the caller
 * can still surface the (already-generated) join link manually. Never log email
 * addresses at info level (CLAUDE.md).
 */
let client: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "Verdocast <onboarding@resend.dev>";

export type SendResult =
  | { ok: true }
  | { ok: false; skipped: true }
  | { ok: false; skipped?: false; error: string };

export async function sendInvitation(
  to: string,
  leagueName: string,
  joinUrl: string,
): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  try {
    const html = await render(InvitationEmail({ leagueName, joinUrl }));
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `${leagueName} — World Cup 2026 Predictor: you're invited`,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "send_failed" };
  }
}
