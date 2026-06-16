import type { ReactNode } from "react";
import { OfficeSweepstakeBody } from "@/components/blog/world-cup-2026-office-sweepstake";
import { WorldCupPredictionLeagueBody } from "@/components/blog/world-cup-2026-prediction-league";
import { ScheduleBody } from "@/components/blog/world-cup-2026-schedule";
import { RemoteTeamIdeasBody } from "@/components/blog/world-cup-remote-team-ideas";

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
  {
    slug: "world-cup-2026-schedule",
    title: "World Cup 2026 schedule: every group-stage fixture",
    description:
      "The full World Cup 2026 group-stage schedule - all 12 groups, 48 teams and 72 matches - plus the easiest way to predict every game.",
    date: "2026-06-17",
    dateLabel: "17 June 2026",
    keywords: [
      "world cup 2026 schedule",
      "world cup 2026 fixtures",
      "world cup 2026 groups",
      "world cup 2026 group stage",
      "world cup 2026 dates",
    ],
    faqs: [
      {
        q: "When does the World Cup 2026 group stage start?",
        a: "The group stage runs from 11 to 27 June 2026. Knockouts begin on 28 June and the final is on 19 July.",
      },
      {
        q: "How many teams and groups are there?",
        a: "48 teams in 12 groups of four (A to L), playing 72 group-stage matches in total.",
      },
      {
        q: "How do teams qualify from the group stage?",
        a: "The top two from each group, plus the eight best third-placed teams, advance to a 32-team knockout round.",
      },
      {
        q: "How can I predict the fixtures?",
        a: "Start a free Verdocast prediction league, predict the score of every match, and a live leaderboard scores it automatically.",
      },
    ],
    Body: ScheduleBody,
  },
  {
    slug: "world-cup-2026-office-sweepstake",
    title: "World Cup 2026 office sweepstake: a free, better alternative",
    description:
      "The office sweepstake is fun for ten seconds. Here's a free alternative that keeps your whole team engaged to the final - no money, no admin, no gambling.",
    date: "2026-06-17",
    dateLabel: "17 June 2026",
    keywords: [
      "world cup 2026 office sweepstake",
      "office sweepstake",
      "world cup sweepstake generator",
      "world cup office competition",
      "work sweepstake alternative",
    ],
    faqs: [
      {
        q: "Is a prediction league better than a sweepstake?",
        a: "For teams, yes - everyone stays in the whole tournament, it rewards skill as well as luck, there's no admin, and no money to handle.",
      },
      {
        q: "Is it gambling?",
        a: "No. There are no entry fees and no cash prizes handled by Verdocast - it's a prediction game with a leaderboard.",
      },
      {
        q: "How much does it cost?",
        a: "It's free for the entire group stage. No card needed to start.",
      },
      {
        q: "Do I need to collect money or track picks?",
        a: "No. Share one join link; everyone predicts and the leaderboard scores itself automatically.",
      },
    ],
    Body: OfficeSweepstakeBody,
  },
  {
    slug: "world-cup-remote-team-ideas",
    title: "Best World Cup competition ideas for remote & hybrid teams",
    description:
      "Seven low-effort ways to bring a remote or hybrid team together around the World Cup - led by the prediction league that runs itself.",
    date: "2026-06-17",
    dateLabel: "17 June 2026",
    keywords: [
      "world cup team building",
      "remote team world cup ideas",
      "employee engagement world cup",
      "hybrid team activities",
      "world cup work competition",
    ],
    faqs: [
      {
        q: "What's the easiest World Cup activity for a remote team?",
        a: "A prediction league - it's async, inclusive, needs no football knowledge, and takes two minutes to set up.",
      },
      {
        q: "Are these activities free?",
        a: "The prediction league is free for the group stage; most of the other ideas cost nothing to run.",
      },
      {
        q: "Do these work across time zones?",
        a: "Yes - a prediction league and a sweepstake are fully asynchronous; people take part whenever suits them.",
      },
    ],
    Body: RemoteTeamIdeasBody,
  },
];

/** Posts newest-first. */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
