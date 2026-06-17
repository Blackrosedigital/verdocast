import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAllPosts, getPostBySlug, isPublished } from "@/lib/blog";

// Re-evaluate hourly so write-ahead posts auto-release when their date arrives.
export const revalidate = 3600;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found | Verdocast" };
  return {
    title: `${post.title} | Verdocast`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !isPublished(post)) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Link
        href="/blog"
        className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← Blog
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {post.dateLabel}
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground sm:text-6xl">
        {post.title}
      </h1>

      <div className="mt-8">
        <post.Body />
      </div>

      {/* FAQ */}
      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-wide text-foreground">
          FAQ
        </h2>
        <dl className="mt-6 space-y-5">
          {post.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-medium text-foreground">{f.q}</dt>
              <dd className="mt-1 text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <div className="mt-14 rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="font-display text-3xl tracking-wide text-foreground">
          Turn the World Cup into your team&rsquo;s ritual
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          A free prediction league anyone can play, live in two minutes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/start">Start a free league</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/play">Join the global league</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
