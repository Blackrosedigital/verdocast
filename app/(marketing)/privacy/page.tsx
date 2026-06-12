import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Verdocast",
  description: "How Verdocast collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

const CONTACT = "support@verdocast.com";
const UPDATED = "12 June 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl tracking-wide text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide text-foreground sm:text-6xl">
        Privacy Policy
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Last updated: {UPDATED}
      </p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Verdocast (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs World Cup prediction
        leagues at verdocast.com. This policy explains what we collect, why, and
        the choices you have.
      </p>

      <Section title="Information we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-foreground">Account &amp; identity:</span>{" "}
            your email address and the display name you choose.
          </li>
          <li>
            <span className="text-foreground">League data:</span> organisation
            and league names you create, and the match score predictions you
            submit.
          </li>
          <li>
            <span className="text-foreground">Payment data:</span> if you buy a
            paid plan, payments are handled by Stripe. We receive confirmation
            and limited billing metadata but never your full card details.
          </li>
          <li>
            <span className="text-foreground">Usage &amp; device data:</span>{" "}
            basic log data (e.g. IP, browser) and, only with your consent,
            product-analytics events.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul className="list-disc space-y-2 pl-5">
          <li>To run your league: create your account, score predictions, and show leaderboards.</li>
          <li>To sign you in with magic links / one-time codes (no passwords).</li>
          <li>To send transactional email (sign-in links and invitations).</li>
          <li>To take payment and manage licenses, where applicable.</li>
          <li>To understand and improve the product (analytics, with your consent).</li>
        </ul>
      </Section>

      <Section title="Legal bases (UK GDPR)">
        <p>
          We process data to perform our contract with you (providing the
          service), for our legitimate interests (securing and improving the
          service), and with your consent (analytics cookies, which you can
          decline).
        </p>
      </Section>

      <Section title="Cookies &amp; analytics">
        <p>
          Essential cookies keep you signed in. With your consent (via the
          cookie banner) we use PostHog for privacy-friendly product analytics.
          You can decline and the site still works.
        </p>
      </Section>

      <Section title="Service providers">
        <p>We share data only with providers that help us run Verdocast:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase &mdash; database &amp; authentication</li>
          <li>Resend &mdash; transactional email</li>
          <li>Stripe &mdash; payment processing</li>
          <li>Vercel &mdash; hosting</li>
          <li>PostHog &mdash; analytics (consent-gated)</li>
        </ul>
        <p>
          Match results come from API-Football; no personal data is shared with
          them. We do not sell your personal data.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          We keep your data for the duration of the tournament and a limited
          grace period afterwards, then delete or anonymise it. You can ask us
          to delete your data sooner.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Under UK GDPR you can request access to, correction of, deletion of,
          or a copy of your data, and object to certain processing. Email us at{" "}
          <a href={`mailto:${CONTACT}`} className="text-primary underline">
            {CONTACT}
          </a>{" "}
          and we&rsquo;ll respond.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Verdocast isn&rsquo;t directed at children under 13, and we don&rsquo;t
          knowingly collect their data.
        </p>
      </Section>

      <Section title="International transfers">
        <p>
          Some providers may process data outside the UK/EEA under appropriate
          safeguards.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update this policy; we&rsquo;ll revise the &ldquo;last
          updated&rdquo; date above when we do.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions or requests:{" "}
          <a href={`mailto:${CONTACT}`} className="text-primary underline">
            {CONTACT}
          </a>
        </p>
      </Section>
    </div>
  );
}
