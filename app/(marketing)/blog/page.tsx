import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog - World Cup 2026 prediction leagues & team play | Verdocast",
  description:
    "Guides and ideas for running a World Cup 2026 prediction league for your office, mates, or community.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide text-foreground sm:text-6xl">
        The Verdocast blog
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Ideas for turning the World Cup into your team&rsquo;s ritual - and
        getting the most out of your prediction league.
      </p>

      <ul className="mt-12 space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {post.dateLabel}
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-wide text-foreground">
                {post.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{post.description}</p>
              <span className="mt-3 inline-block text-sm text-primary underline">
                Read more →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
