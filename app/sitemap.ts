import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verdocast.com";
const GROUPS = "abcdefghijkl".split("");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/world-cup-2026`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/play`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/demo`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const groups: MetadataRoute.Sitemap = GROUPS.map((g) => ({
    url: `${SITE}/world-cup-2026/group/${g}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...core, ...groups];
}
