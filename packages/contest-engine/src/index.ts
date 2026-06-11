export interface ContestAlert {
  id: string;
  platform: string;
  name: string;
  startsAt: string;
  durationMinutes: number;
  url: string;
  reason: string;
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
