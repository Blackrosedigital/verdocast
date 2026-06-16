import type { ReactNode } from "react";
import { WorldCupPredictionLeagueBody } from "@/components/blog/world-cup-2026-prediction-league";

/**
 * Blog registry. Posts are typed React components (no markdown dependency) plus
 * metadata used for listing, SEO, and FAQ schema. Add a post by writing a body
 * component in components/blog/ and adding an entry here.
 */
export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description + list excerpt. */
  description: string;
  /** ISO date for sitemap/sorting. */
  date: string;
  /** Human-friendly date label. */
  dateLabel: string;
  keywords: string[];
  faqs: { q: string; a: string }[];
  Body: () => ReactNode;
}

export const POSTS: BlogPost[] = [
  {
    slug: "world-cup-2026-prediction-league",
    title: "Turn the World Cup into your team's ritual",
    description:
      "Set up a free World Cup 2026 prediction league in two minutes - anyone can play, scores update automatically, live leaderboard. No gambling, no spreadsheets.",
    date: "2026-06-17",
    dateLabel: "17 June 2026",
    keywords: [
      "world cup 2026 prediction league",
      "office world cup sweepstake",
      "team prediction game",
      "world cup office competition",
      "free world cup predictor",
    ],
    faqs: [
      {
        q: "Is it free?",
        a: "Yes - free for the entire group stage. No card needed to start.",
      },
      {
        q: "Do I need to know football to play?",
        a: "No. You're predicting scores, not answering trivia. Non-fans win all the time.",
      },
      {
        q: "Is this gambling?",
        a: "No. There are no entry fees and no cash prizes handled by Verdocast - it's a prediction game with a leaderboard, not a betting pool.",
      },
      {
        q: "How many people can join?",
        a: "Plenty - leagues scale to large teams, and you just share a single join link.",
      },
      {
        q: "How does scoring work?",
        a: "Exact score 5, correct goal difference 3, correct result 2, otherwise 0 - and it's all automatic when matches finish.",
      },
    ],
    Body: WorldCupPredictionLeagueBody,
  },
];

/** Posts newest-first. */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
