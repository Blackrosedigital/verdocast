import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export const runtime = "nodejs";
export const alt = "Verdocast blog - World Cup 2026 prediction leagues";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Prerender OG images for published posts; future ones generate on demand.
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? "The Verdocast blog";
  // Scale the headline down for longer titles so it always fits.
  const fontSize = title.length > 52 ? 60 : title.length > 36 ? 72 : 86;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0b0d",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 4,
            color: "#8a8d93",
          }}
        >
          VERDOCAST · WORLD CUP 2026
        </div>

        <div
          style={{
            display: "flex",
            fontSize,
            fontWeight: 800,
            color: "#f5f3ee",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: "#8a8d93" }}>
            Turn the World Cup into your team&rsquo;s ritual
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              color: "#0a0b0d",
              backgroundColor: "#e6ff3d",
              padding: "12px 22px",
              borderRadius: 10,
            }}
          >
            verdocast.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
