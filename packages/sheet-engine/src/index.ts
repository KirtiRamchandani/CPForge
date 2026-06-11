import type { Problem } from "@cp-forge/schemas";
import { stableId } from "@cp-forge/utils";
import generatedProblems from "./generated-problems.json";

export interface SheetFilter {
  topic?: string;
  pattern?: string;
  company?: string;
  level?: string;
  cpLevel?: string;
  weakTopics?: string[];
  revisionOnly?: boolean;
  upsolveOnly?: boolean;
}

const seedProblems: Problem[] = [
  problem("leetcode", "1", "Two Sum", "https://leetcode.com/problems/two-sum/", "easy", 800, ["arrays", "hashing"], ["hash map"], ["amazon", "google"], "beginner"),
  problem("leetcode", "121", "Best Time to Buy and Sell Stock", "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", "easy", 900, ["arrays"], ["prefix min"], ["amazon", "microsoft"], "beginner"),
  problem("leetcode", "3", "Longest Substring Without Repeating Characters", "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "medium", 1200, ["strings"], ["sliding-window"], ["amazon", "meta"], "intermediate"),
  problem("leetcode", "76", "Minimum Window Substring", "https://leetcode.com/problems/minimum-window-substring/", "hard", 1700, ["strings"], ["sliding-window"], ["amazon", "google"], "advanced"),
  problem("leetcode", "200", "Number of Islands", "https://leetcode.com/problems/number-of-islands/", "medium", 1300, ["graphs"], ["bfs shortest path", "dfs connected components"], ["amazon", "microsoft"], "intermediate"),
  problem("leetcode", "207", "Course Schedule", "https://leetcode.com/problems/course-schedule/", "medium", 1500, ["graphs"], ["topological sort"], ["google", "meta"], "intermediate"),
  problem("leetcode", "322", "Coin Change", "https://leetcode.com/problems/coin-change/", "medium", 1500, ["dynamic-programming"], ["knapsack DP"], ["amazon", "microsoft"], "intermediate"),
  problem("leetcode", "300", "Longest Increasing Subsequence", "https://leetcode.com/problems/longest-increasing-subsequence/", "medium", 1600, ["dynamic-programming"], ["LIS DP"], ["google", "adobe"], "intermediate"),
  problem("leetcode", "98", "Validate Binary Search Tree", "https://leetcode.com/problems/validate-binary-search-tree/", "medium", 1300, ["trees", "bst"], ["dfs"], ["amazon", "microsoft"], "intermediate"),
  problem("codeforces", "4A", "Watermelon", "https://codeforces.com/problemset/problem/4/A", "800", 800, ["implementation"], ["parity"], [], "newbie"),
  problem("codeforces", "580A", "Kefa and First Steps", "https://codeforces.com/problemset/problem/580/A", "900", 900, ["arrays"], ["two pointers"], [], "newbie"),
  problem("codeforces", "455A", "Boredom", "https://codeforces.com/problemset/problem/455/A", "1500", 1500, ["dynamic-programming"], ["1D DP"], [], "specialist"),
  problem("codeforces", "20C", "Dijkstra?", "https://codeforces.com/problemset/problem/20/C", "1900", 1900, ["graphs"], ["dijkstra"], [], "expert"),
  problem("codeforces", "165E", "Compatible Numbers", "https://codeforces.com/problemset/problem/165/E", "2100", 2100, ["bit-manipulation", "dynamic-programming"], ["bitmask DP"], [], "candidate-master")
];

const mergeProblems = (): Problem[] => {
  const map = new Map<string, Problem>();
  for (const item of [...seedProblems, ...(generatedProblems as Problem[])]) {
    map.set(item.id, item);
  }
  return [...map.values()];
};

export const problemBank: Problem[] = mergeProblems();

export const filterSheet = (problems: Problem[], filter: SheetFilter): Problem[] =>
  problems.filter((problem) => {
    if (filter.topic && !problem.topics.includes(filter.topic)) return false;
    if (filter.pattern && !problem.patterns.includes(filter.pattern)) return false;
    if (filter.company && !problem.companies.includes(filter.company.toLowerCase())) return false;
    if (filter.level && problem.level !== filter.level) return false;
    if (filter.cpLevel && problem.platform === "codeforces" && problem.level !== filter.cpLevel) return false;
    if (filter.weakTopics?.length && !problem.topics.some((topic) => filter.weakTopics?.includes(topic))) return false;
    if (filter.revisionOnly && problem.status !== "review_later" && problem.confidence >= 60) return false;
    if (filter.upsolveOnly && problem.status !== "upsolve" && problem.status !== "attempted") return false;
    return true;
  });

export const generateCompanySheet = (company: string, days = 30): Problem[] => {
  const normalized = company.toLowerCase();
  const companyProblems = filterSheet(problemBank, { company: normalized });
  return companyProblems.map((problem, index) => ({
    ...problem,
    notes: index < Math.ceil(days / 10) ? "Must do" : index % 2 === 0 ? "High frequency" : "Revision"
  }));
};

function problem(
  platform: Problem["platform"],
  platformId: string,
  title: string,
  url: string,
  difficulty: string,
  rating: number,
  topics: string[],
  patterns: string[],
  companies: string[],
  level: string
): Problem {
  return {
    id: stableId(platform, platformId, title),
    platform,
    platformId,
    title,
    url,
    difficulty,
    rating,
    topics,
    patterns,
    companies,
    level,
    status: "unseen",
    attempts: 0,
    confidence: 0,
    notes: "",
    mistakes: [],
    source: "static"
  };
}
