import type { ReactNode } from "react";
import { EnglandCroatiaBody } from "@/components/blog/england-v-croatia-world-cup-2026";
import { KeepLeagueAliveBody } from "@/components/blog/keep-your-league-alive-knockouts";
import { PredictionVsFantasyBody } from "@/components/blog/prediction-league-vs-fantasy-football";
import { ScoringExplainedBody } from "@/components/blog/prediction-league-scoring-explained";
import { OfficeSweepstakeBody } from "@/components/blog/world-cup-2026-office-sweepstake";
import { KnockoutStageBody } from "@/components/blog/world-cup-2026-knockout-stage";
import { LastSixteenBody } from "@/components/blog/world-cup-2026-last-16";
import { WorldCupPredictionLeagueBody } from "@/components/blog/world-cup-2026-prediction-league";
import { QuarterFinalsBody } from "@/components/blog/world-cup-2026-quarter-finals";
import { RecapBody } from "@/components/blog/world-cup-2026-recap";
import { ScheduleBody } from "@/components/blog/world-cup-2026-schedule";
import { FinalPredictorBody } from "@/components/blog/world-cup-final-predictor";
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
    slug: "england-v-croatia-world-cup-2026",
    title: "England v Croatia: World Cup 2026 Group L preview",
    description:
      "England face Croatia in their World Cup 2026 Group L opener at AT&T Stadium. Kick-off times, what to expect, and how to predict the score.",
    date: "2026-06-17",
    dateLabel: "17 June 2026",
    keywords: [
      "england v croatia",
      "england croatia world cup 2026",
      "england croatia prediction",
      "world cup 2026 group l",
      "england world cup 2026",
    ],
    faqs: [
      {
        q: "What time is England v Croatia?",
        a: "Kick-off is 9:00pm BST (3:00pm ET) at AT&T Stadium, Arlington, in the World Cup 2026 Group L opener.",
      },
      {
        q: "What group are England and Croatia in?",
        a: "Both are in Group L, alongside Ghana and Panama.",
      },
      {
        q: "How can I predict the score?",
        a: "Start a free Verdocast league or join the global league, predict the score before kick-off, and the leaderboard scores it automatically.",
      },
    ],
    Body: EnglandCroatiaBody,
  },
  {
    slug: "world-cup-2026-prediction-league",
    title: "Turn the World Cup into your team's ritual",
    description:
      "Set up a free World Cup 2026 prediction league in two minutes - anyone can play, scores update automatically, live leaderboard. No gambling, no spreadsheets.",
    date: "2026-06-11",
    dateLabel: "11 June 2026",
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
    date: "2026-06-13",
    dateLabel: "13 June 2026",
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
    date: "2026-06-15",
    dateLabel: "15 June 2026",
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
  {
    slug: "prediction-league-scoring-explained",
    title: "How prediction league scoring works",
    description:
      "The 5/3/2/0 scoring system explained, with a worked example - and why it keeps a prediction league competitive to the final whistle.",
    date: "2026-06-20",
    dateLabel: "20 June 2026",
    keywords: [
      "prediction league scoring",
      "how does prediction league scoring work",
      "football prediction points system",
      "world cup predictor scoring",
    ],
    faqs: [
      {
        q: "How many points is an exact score worth?",
        a: "5 points for an exact score, 3 for correct goal difference (non-draws), 2 for the correct result, and 0 otherwise.",
      },
      {
        q: "Do I need to predict the exact score to win?",
        a: "No. A correct result still scores 2 points, so you climb the leaderboard even without nailing the scoreline.",
      },
      {
        q: "How is the goal-difference bonus handled for draws?",
        a: "It only applies to non-draws. A wrong-score draw (e.g. 1-1 for a 0-0) earns the result points, not the goal-difference bonus.",
      },
    ],
    Body: ScoringExplainedBody,
  },
  {
    slug: "world-cup-2026-knockout-stage",
    title: "World Cup 2026 knockout stage: format, dates & bracket",
    description:
      "How the World Cup 2026 knockouts work - the new Round of 32, qualification, all the round dates, and how to keep predicting to the final.",
    date: "2026-06-24",
    dateLabel: "24 June 2026",
    keywords: [
      "world cup 2026 knockout stage",
      "world cup 2026 bracket",
      "world cup 2026 round of 32",
      "world cup 2026 knockout dates",
    ],
    faqs: [
      {
        q: "When do the World Cup 2026 knockouts start?",
        a: "The Round of 32 runs 28 June to 3 July, the Round of 16 from 4 to 7 July, quarter-finals 9 to 11 July, semi-finals 14 and 15 July, and the final on 19 July.",
      },
      {
        q: "How many teams reach the knockouts?",
        a: "32 - the top two from each of the 12 groups, plus the eight best third-placed teams.",
      },
      {
        q: "What happens if a knockout match is level?",
        a: "Extra time, then a penalty shoot-out if still level. It's single-elimination - the loser is out.",
      },
    ],
    Body: KnockoutStageBody,
  },
  {
    slug: "keep-your-league-alive-knockouts",
    title: "Keep your office league alive for the knockouts",
    description:
      "The group stage is over - don't let your prediction league go quiet now. Here's how to carry the energy through the World Cup 2026 knockouts.",
    date: "2026-06-28",
    dateLabel: "28 June 2026",
    keywords: [
      "world cup knockout predictions",
      "office world cup league knockouts",
      "keep prediction league going",
      "world cup 2026 office competition",
    ],
    faqs: [
      {
        q: "Is it too late to start a league for the knockouts?",
        a: "No - a fresh knockout leaderboard is its own clean competition. Start a free league and share one link.",
      },
      {
        q: "Do I need to set anything up again?",
        a: "No. Your league, members and leaderboard carry straight through to the knockouts.",
      },
    ],
    Body: KeepLeagueAliveBody,
  },
  {
    slug: "world-cup-2026-last-16",
    title: "World Cup 2026 last 16: how to read (and predict) the run-in",
    description:
      "The field is down to 16. What changes in the knockouts, how to predict tighter games, and where to follow the bracket live.",
    date: "2026-07-02",
    dateLabel: "2 July 2026",
    keywords: [
      "world cup 2026 last 16",
      "world cup 2026 round of 16",
      "world cup 2026 predictions",
      "how to predict knockout football",
    ],
    faqs: [
      {
        q: "How should I predict knockout matches?",
        a: "Lean towards lower scorelines, back defensive solidity, and remember a correct result still scores even if you miss the exact score.",
      },
      {
        q: "Does extra time count in my prediction?",
        a: "Predict the result at the end of normal time as scored by your league's rules; knockout drama (extra time, penalties) is part of the fun to factor in.",
      },
    ],
    Body: LastSixteenBody,
  },
  {
    slug: "world-cup-2026-quarter-finals",
    title: "World Cup 2026 quarter-finals: predictions & what to watch",
    description:
      "Eight teams left. What the last eight tells us, how to predict tight quarter-finals, and why every point now swings the leaderboard.",
    date: "2026-07-07",
    dateLabel: "7 July 2026",
    keywords: [
      "world cup 2026 quarter finals",
      "world cup 2026 quarter final predictions",
      "world cup 2026 last 8",
    ],
    faqs: [
      {
        q: "What makes quarter-finals hard to predict?",
        a: "They're tight and often go to extra time. Trust momentum and form over reputation, and don't over-predict goals.",
      },
      {
        q: "Can I still climb the leaderboard this late?",
        a: "Yes - with fewer matches left, a single exact score (worth 5) can jump you several places.",
      },
    ],
    Body: QuarterFinalsBody,
  },
  {
    slug: "world-cup-final-predictor",
    title: "Run a World Cup final predictor for your team",
    description:
      "The final is the easiest win of the tournament. Set up a free, two-minute final predictor for your team - even if you never ran a league.",
    date: "2026-07-12",
    dateLabel: "12 July 2026",
    keywords: [
      "world cup final predictor",
      "world cup final sweepstake",
      "world cup final score prediction",
      "office world cup final",
    ],
    faqs: [
      {
        q: "Can I run a predictor for just the final?",
        a: "Yes - create a free league, share the link before kickoff, and everyone predicts the one match. The leaderboard settles it.",
      },
      {
        q: "How should I predict the final?",
        a: "Finals are cagey - a tight 1-0 or 2-1, or a draw heading to extra time, is rarely a bad shout. A correct result still scores.",
      },
    ],
    Body: FinalPredictorBody,
  },
  {
    slug: "world-cup-2026-recap",
    title: "What we learned running prediction leagues at the 2026 World Cup",
    description:
      "A month of predicting the World Cup together: the quiet ones win, automatic scoring is everything, and the knockouts carried the energy.",
    date: "2026-07-21",
    dateLabel: "21 July 2026",
    keywords: [
      "world cup office league",
      "world cup prediction league recap",
      "team prediction game results",
    ],
    faqs: [
      {
        q: "What makes a prediction league work for a team?",
        a: "Inclusivity (no football knowledge needed), automatic scoring (no admin), and the knockouts keeping engagement high to the final.",
      },
    ],
    Body: RecapBody,
  },
  {
    slug: "prediction-league-vs-fantasy-football",
    title: "Prediction league vs. fantasy football: which is better for a team?",
    description:
      "Fantasy football is deep but demanding; a prediction league is light and inclusive. Here's how they compare - and which suits a whole team.",
    date: "2026-06-19",
    dateLabel: "19 June 2026",
    keywords: [
      "prediction league vs fantasy football",
      "fantasy football alternative",
      "best football game for office",
      "inclusive football competition",
    ],
    faqs: [
      {
        q: "What's the difference between a prediction league and fantasy football?",
        a: "Fantasy means drafting and managing real players; a prediction league just means predicting match scores - no squads, no transfers, no homework.",
      },
      {
        q: "Which is better for a mixed-ability group?",
        a: "A prediction league - anyone can take part and do well, whereas fantasy rewards dedicated football fans.",
      },
    ],
    Body: PredictionVsFantasyBody,
  },
];

/**
 * A post is live once its `date` (UTC midnight) has arrived. Future-dated posts
 * are write-ahead drafts: hidden from the index, sitemap, and direct URL until
 * their date passes. Blog pages use ISR so this re-evaluates without a redeploy.
 */
export function isPublished(post: BlogPost, now: number = Date.now()): boolean {
  return new Date(post.date).getTime() <= now;
}

/** Published posts, newest-first. */
export function getAllPosts(): BlogPost[] {
  const now = Date.now();
  return POSTS.filter((p) => isPublished(p, now)).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

/** Any post by slug (published or not — callers gate with isPublished). */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
