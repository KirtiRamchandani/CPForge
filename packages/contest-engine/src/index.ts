import type { Problem } from "@cp-forge/schemas";
import { problemBank } from "@cp-forge/sheet-engine";

export interface ContestAlert {
  id: string;
  platform: string;
  name: string;
  startsAt: string;
  durationMinutes: number;
  url: string;
  reason: string;
}

export interface VirtualContestPlan {
  id: string;
  platform: string;
  title: string;
  targetRating: number;
  problems: Problem[];
  durationMinutes: number;
  upsolveAfter: boolean;
  checklist: string[];
}

export interface CodeforcesContestRow {
  id: number;
  name: string;
  type: string;
  phase: string;
  startTimeSeconds?: number;
  durationSeconds?: number;
}

export const upcomingContestAlerts = (contests: ContestAlert[], now = new Date()): ContestAlert[] =>
  contests
    .filter((contest) => new Date(contest.startsAt).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 10);

export const contestReadinessMessage = (solvedRecent: number, upsolveOpen: number): string => {
  if (upsolveOpen > 5) return "Clear upsolve debt before the next rated contest.";
  if (solvedRecent < 10) return "Do one virtual contest and review it before chasing rating.";
  return "You are ready for a contest block; protect review time afterward.";
};

export const parseCodeforcesContests = (rows: CodeforcesContestRow[]): ContestAlert[] =>
  rows
    .filter((row) => row.phase === "BEFORE" || row.phase === "CODING")
    .map((row) => ({
      id: `cf-${row.id}`,
      platform: "codeforces",
      name: row.name,
      startsAt: new Date((row.startTimeSeconds ?? 0) * 1000).toISOString(),
      durationMinutes: Math.round((row.durationSeconds ?? 7200) / 60),
      url: `https://codeforces.com/contest/${row.id}`,
      reason: row.type === "ICPC" ? "Team practice block" : "Rating opportunity — virtual if you miss live"
    }));

export const buildVirtualContest = (targetRating: number, platform = "codeforces", problems = problemBank): VirtualContestPlan => {
  const window = platform === "codeforces" ? 250 : 200;
  const picks = problems
    .filter((problem) => problem.platform === platform && (problem.rating ?? 0) <= targetRating + window)
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
    .slice(0, 6);

  return {
    id: `virtual-${platform}-${targetRating}-${Date.now()}`,
    platform,
    title: `${platform} virtual block @ ${targetRating}`,
    targetRating,
    problems: picks,
    durationMinutes: 120,
    upsolveAfter: true,
    checklist: [
      "Read all problems in 10 minutes",
      "Implement brute force before optimizing",
      "Track WA/TLE reasons in mistake bank",
      "Upsolve every unsolved problem within 48h"
    ]
  };
};

export const postContestUpsolveIds = (attemptedIds: string[], solvedIds: string[]): string[] =>
  attemptedIds.filter((id) => !solvedIds.includes(id));
