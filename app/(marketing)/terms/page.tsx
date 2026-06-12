import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Verdocast",
  description: "The terms for using Verdocast.",
  alternates: { canonical: "/terms" },
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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide text-foreground sm:text-6xl">
        Terms of Service
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Last updated: {UPDATED}
      </p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        These terms govern your use of Verdocast at verdocast.com (the
        &ldquo;Service&rdquo;). By creating a league, joining one, or otherwise
        using the Service, you agree to these terms.
      </p>

      <Section title="The Service">
        <p>
          Verdocast lets you run and play prediction leagues for football
          tournaments: members forecast match scores, results are scored
          automatically, and a leaderboard ranks players. The Service is
          provided for entertainment.
        </p>
      </Section>

      <Section title="Accounts &amp; sign-in">
        <p>
          Sign-in is passwordless (magic links or one-time codes). You&rsquo;re
          responsible for keeping access to your email secure and for activity
          under your account. Provide an email address you control and a display
          name that isn&rsquo;t offensive or impersonating.
        </p>
      </Section>

      <Section title="Free during the group stage">
        <p>
          The group-stage predictor is currently free. We may introduce paid
          features (for example knockout-stage predictions) later; any charges
          will be made clear before you pay, via Stripe. Where a paid plan
          applies, the league size cap of that plan is enforced.
        </p>
      </Section>

      <Section title="Acceptable use">
        <ul className="list-disc space-y-2 pl-5">
          <li>Don&rsquo;t abuse, disrupt, or attempt to break the Service or its security.</li>
          <li>Don&rsquo;t use it unlawfully, or to harass other members.</li>
          <li>Don&rsquo;t scrape, resell, or misrepresent the Service.</li>
          <li>Don&rsquo;t invite people to a league without a reasonable basis to contact them.</li>
        </ul>
        <p>We may suspend or remove leagues or members that breach these terms.</p>
      </Section>

      <Section title="Predictions &amp; scoring">
        <p>
          Predictions lock at each match&rsquo;s kickoff and can&rsquo;t be
          changed afterwards. Scoring uses your league&rsquo;s rules (by default:
          exact score 5, correct goal difference 3, correct result 2). Match
          results are sourced from third-party data and may occasionally be
          delayed or corrected; we score based on the results we receive.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You keep ownership of the names and predictions you submit. You grant
          us the permission needed to host and display them within the Service
          (for example, on leaderboards visible to your league).
        </p>
      </Section>

      <Section title="Availability">
        <p>
          We aim to keep the Service running but provide it &ldquo;as is&rdquo;
          without guarantees of uninterrupted availability. We may change,
          suspend, or discontinue features.
        </p>
      </Section>

      <Section title="Not affiliated">
        <p>
          Verdocast is an independent product and is not affiliated with,
          endorsed by, or sponsored by FIFA or any football governing body. Team
          names and tournament data are used for identification only.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the extent permitted by law, Verdocast is not liable for indirect or
          consequential losses, or for loss arising from your use of (or
          inability to use) the Service. Nothing in these terms excludes
          liability that can&rsquo;t be excluded by law.
        </p>
      </Section>

      <Section title="Privacy">
        <p>
          Our{" "}
          <a href="/privacy" className="text-primary underline">
            Privacy Policy
          </a>{" "}
          explains how we handle your data and forms part of these terms.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms; we&rsquo;ll revise the &ldquo;last
          updated&rdquo; date above. Continued use after a change means you
          accept the updated terms.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions:{" "}
          <a href={`mailto:${CONTACT}`} className="text-primary underline">
            {CONTACT}
          </a>
        </p>
      </Section>
    </div>
  );
}
