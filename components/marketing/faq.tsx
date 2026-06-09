export interface FaqItem {
  q: string;
  a: string;
}

/** Shared so the rendered FAQ and the FAQPage JSON-LD never drift apart. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How does it work for my employees?",
    a: "You buy a license, name your league, and share a join link. Employees predict the score of every group-stage match. When matches finish, points are scored automatically and the live leaderboard updates.",
  },
  {
    q: "How are predictions scored?",
    a: "Exact score earns 5 points, correct goal difference earns 3, a correct result (win/draw/loss) earns 2, and anything else earns 0.",
  },
  {
    q: "When does the tournament run?",
    a: "The FIFA World Cup 2026 runs from 11 June to 19 July 2026. Predictions for each match lock at kickoff.",
  },
  {
    q: "Do employees need to create an account?",
    a: "No passwords. Members join with a magic link sent to their email — one click and they’re predicting.",
  },
  {
    q: "What if I have more than 1,000 people?",
    a: "Our Enterprise tier covers 5,000+ employees with custom scoring and league branding. Get in touch and we’ll set you up.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes. If it’s not right for your team, contact us before the tournament starts for a full refund.",
  },
];

export function Faq() {
  return (
    <dl className="divide-y divide-border rounded-xl border border-border bg-surface">
      {FAQ_ITEMS.map((item) => (
        <div key={item.q} className="p-6">
          <dt className="font-display text-xl tracking-wide text-foreground">
            {item.q}
          </dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {item.a}
          </dd>
        </div>
      ))}
    </dl>
  );
}
