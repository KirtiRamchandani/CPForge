import type { Platform, Problem } from "@cp-forge/schemas";
import { stableId } from "@cp-forge/utils";

export interface AdapterCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
}

export class MemoryCache implements AdapterCache {
  private readonly entries = new Map<string, { expires: number; value: unknown }>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);
    if (!entry || entry.expires < Date.now()) return undefined;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    this.entries.set(key, { value, expires: Date.now() + ttlMs });
  }
}

export interface CodeforcesClientOptions {
  cache?: AdapterCache;
  baseUrl?: string;
  minIntervalMs?: number;
}

export class CodeforcesApiClient {
  private readonly cache: AdapterCache;
  private readonly baseUrl: string;
  private readonly minIntervalMs: number;
  private nextAllowedAt = 0;

  constructor(options: CodeforcesClientOptions = {}) {
    this.cache = options.cache ?? new MemoryCache();
    this.baseUrl = options.baseUrl ?? "https://codeforces.com/api";
    this.minIntervalMs = options.minIntervalMs ?? 2_000;
  }

  async problemsetProblems() {
    return this.request("problemset.problems", {}, 24 * 60 * 60 * 1000);
  }

  async userStatus(handle: string) {
    return this.request("user.status", { handle }, 15 * 60 * 1000);
  }

  async userInfo(handle: string) {
    return this.request("user.info", { handles: handle }, 60 * 60 * 1000);
  }

  async userRating(handle: string) {
    return this.request("user.rating", { handle }, 60 * 60 * 1000);
  }

  async contestList() {
    return this.request("contest.list", {}, 30 * 60 * 1000);
  }

  async contestStandings(contestId: number, handle: string, from = 1, count = 1) {
    return this.request(
      "contest.standings",
      { contestId, from, count, handles: handle, showUnofficial: false },
      10 * 60 * 1000
    );
  }

  async recentSubmissions(handle: string, count = 20) {
    return this.userStatus(handle).then((rows) => (Array.isArray(rows) ? rows.slice(0, count) : rows));
  }

  async request(method: string, params: Record<string, string | number | boolean>, ttlMs: number) {
    const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
    const url = `${this.baseUrl}/${method}${query.size ? `?${query.toString()}` : ""}`;
    const cached = await this.cache.get<unknown>(url);
    if (cached) return cached;

    await this.waitForSlot();
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Codeforces ${method} failed with HTTP ${response.status}`);
    }
    const body = (await response.json()) as { status: string; comment?: string; result?: unknown };
    if (body.status !== "OK") {
      throw new Error(`Codeforces ${method} failed: ${body.comment ?? "unknown error"}`);
    }
    await this.cache.set(url, body.result, ttlMs);
    return body.result;
  }

  private async waitForSlot() {
    const now = Date.now();
    const delay = Math.max(0, this.nextAllowedAt - now);
    this.nextAllowedAt = Math.max(now, this.nextAllowedAt) + this.minIntervalMs;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export const parseCodeforcesProblemLinks = (html: string): Problem[] => {
  const matches = [...html.matchAll(/href="(\/(?:problemset\/problem|contest\/\d+\/problem)\/([^"]+))"[^>]*>([^<]+)</g)];
  return matches.map((match) => ({
    id: stableId("codeforces", match[2]),
    platform: "codeforces",
    platformId: match[2] ?? "unknown",
    title: strip(match[3] ?? "Codeforces Problem"),
    url: `https://codeforces.com${match[1]}`,
    difficulty: "unknown",
    topics: [],
    patterns: [],
    companies: [],
    level: "unknown",
    status: "unseen",
    attempts: 0,
    confidence: 0,
    notes: "",
    mistakes: [],
    source: "codeforces-dom"
  }));
};

export const parseLeetCodeProblemPage = (html: string, url: string): Problem => {
  const title = strip(firstMatch(html, /<title>(.*?)\s+-\s+LeetCode<\/title>/) ?? firstMatch(html, /data-cy="question-title"[^>]*>(.*?)</) ?? "LeetCode Problem");
  const difficulty = strip(firstMatch(html, /(Easy|Medium|Hard)/) ?? "unknown");
  const slug = url.split("/problems/")[1]?.split("/")[0] ?? title;
  return {
    id: stableId("leetcode", slug),
    platform: "leetcode",
    platformId: slug,
    title,
    url,
    difficulty,
    topics: [],
    patterns: [],
    companies: [],
    level: difficulty.toLowerCase(),
    status: "unseen",
    attempts: 0,
    confidence: 0,
    notes: "",
    mistakes: [],
    source: "leetcode-dom"
  };
};

export const parseCustomCsv = (csv: string, platform: Platform = "custom"): Problem[] => {
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  const headers = splitCsvLine(headerLine ?? "");
  return rows.filter(Boolean).map((row) => {
    const values = splitCsvLine(row);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const title = record.title || record.Problem || record.problem || "Imported Problem";
    const url = record.url || record.URL || "file://local-import";
    return {
      id: stableId(platform, title, url),
      platform,
      platformId: record.platformId || title,
      title,
      url,
      difficulty: record.difficulty || "unknown",
      rating: record.rating ? Number(record.rating) : undefined,
      topics: splitList(record.topics || record.Topic || record.topic),
      patterns: splitList(record.patterns || record.Pattern || record.pattern),
      companies: splitList(record.companies || record.Company || record.company).map((value) => value.toLowerCase()),
      level: record.level || "unknown",
      status: "unseen",
      attempts: 0,
      confidence: 0,
      notes: record.notes || "",
      mistakes: [],
      source: "custom-import"
    };
  });
};

export interface LeetCodeClientOptions {
  cache?: AdapterCache;
  endpoint?: string;
  minIntervalMs?: number;
}

export class LeetCodeGraphQLClient {
  private readonly cache: AdapterCache;
  private readonly endpoint: string;
  private readonly minIntervalMs: number;
  private nextAllowedAt = 0;

  constructor(options: LeetCodeClientOptions = {}) {
    this.cache = options.cache ?? new MemoryCache();
    this.endpoint = options.endpoint ?? "https://leetcode.com/graphql";
    this.minIntervalMs = options.minIntervalMs ?? 2_000;
  }

  async recentAcSubmissions(username: string, limit = 50) {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          title
          titleSlug
          timestamp
        }
      }`;
    return this.query("recentAcSubmissions", query, { username, limit }, 30 * 60 * 1000);
  }

  async userProfile(username: string) {
    const query = `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats {
            acSubmissionNum { difficulty count }
          }
        }
      }`;
    return this.query("userProfile", query, { username }, 60 * 60 * 1000);
  }

  async query<T>(label: string, query: string, variables: Record<string, unknown>, ttlMs: number): Promise<T> {
    const cacheKey = `leetcode:${label}:${JSON.stringify(variables)}`;
    const cached = await this.cache.get<T>(cacheKey);
    if (cached) return cached;

    await this.waitForSlot();
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables })
    });
    if (!response.ok) {
      throw new Error(`LeetCode ${label} failed with HTTP ${response.status}`);
    }
    const body = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
    if (body.errors?.length) {
      throw new Error(`LeetCode ${label} failed: ${body.errors[0]?.message ?? "unknown error"}`);
    }
    if (!body.data) {
      throw new Error(`LeetCode ${label} returned empty data`);
    }
    await this.cache.set(cacheKey, body.data, ttlMs);
    return body.data;
  }

  private async waitForSlot() {
    const now = Date.now();
    const delay = Math.max(0, this.nextAllowedAt - now);
    this.nextAllowedAt = Math.max(now, this.nextAllowedAt) + this.minIntervalMs;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export const leetcodeSubmissionsToProblems = (
  submissions: Array<{ title: string; titleSlug: string; timestamp: string }>
): Problem[] =>
  submissions.map((submission) => ({
    id: stableId("leetcode", submission.titleSlug),
    platform: "leetcode",
    platformId: submission.titleSlug,
    title: submission.title,
    url: `https://leetcode.com/problems/${submission.titleSlug}/`,
    difficulty: "unknown",
    topics: [],
    patterns: [],
    companies: [],
    level: "leetcode",
    status: "solved",
    attempts: 1,
    confidence: 80,
    notes: "",
    mistakes: [],
    source: "leetcode-graphql",
    solvedAt: new Date(Number(submission.timestamp) * 1000).toISOString().slice(0, 10)
  }));

export const parseAtCoderProblemPage = (html: string, url: string): Problem => {
  const title = strip(firstMatch(html, /<span class="lang-en">([^<]+)<\/span>/) ?? documentTitle(html, "AtCoder"));
  const slug = url.split("/tasks/")[1]?.replace(/\/$/, "") ?? title;
  return baseDomProblem("atcoder", slug, title, url, "atcoder", []);
};

export const parseGfgProblemPage = (html: string, url: string): Problem => {
  const title = strip(firstMatch(html, /<h1[^>]*>([^<]+)<\/h1>/) ?? "GFG Problem");
  const difficulty = strip(firstMatch(html, /(School|Basic|Easy|Medium|Hard)/) ?? "unknown");
  const slug = url.split("/problems/")[1]?.split("/")[0] ?? slugify(title);
  return baseDomProblem("gfg", slug, title, url, difficulty, []);
};

export const parseCsesProblemPage = (html: string, url: string): Problem => {
  const title = strip(firstMatch(html, /<h1>([^<]+)<\/h1>/) ?? "CSES Problem");
  const slug = url.split("/").pop() ?? slugify(title);
  return baseDomProblem("cses", slug, title, url, "cses", []);
};

export const parseCodeChefProblemPage = (html: string, url: string): Problem => {
  const title = strip(firstMatch(html, /<h1[^>]*class="[^"]*problem-name[^"]*"[^>]*>([^<]+)<\/h1>/) ?? firstMatch(html, /<title>([^<|]+)/) ?? "CodeChef Problem");
  const slug = url.split("/problems/")[1]?.split("/")[0] ?? slugify(title);
  return baseDomProblem("codechef", slug, title, url, "codechef", []);
};

export const parseHackerRankProblemPage = (html: string, url: string): Problem => {
  const title = strip(firstMatch(html, /<h1[^>]*>([^<]+)<\/h1>/) ?? "HackerRank Challenge");
  const slug = url.split("/challenges/")[1]?.split("/")[0] ?? slugify(title);
  const difficulty = strip(firstMatch(html, /(Easy|Medium|Hard)/) ?? "unknown");
  return baseDomProblem("hackerrank", slug, title, url, difficulty, []);
};

export const parseInterviewBitProblemPage = (html: string, url: string): Problem => {
  const title = strip(firstMatch(html, /<h1[^>]*>([^<]+)<\/h1>/) ?? "InterviewBit Problem");
  const slug = url.split("/problems/")[1]?.split("/")[0] ?? slugify(title);
  return baseDomProblem("interviewbit", slug, title, url, "unknown", []);
};

export const detectProblemFromPage = (html: string, url: string): Problem | null => {
  const host = new URL(url).hostname;
  if (host.includes("leetcode.com") && url.includes("/problems/")) return parseLeetCodeProblemPage(html, url);
  if (host.includes("codeforces.com") && url.includes("/problem")) {
    const title = strip(firstMatch(html, /<div class="title">([^<]+)<\/div>/) ?? "Codeforces Problem");
    const parts = url.match(/problem\/(\d+)\/([A-Z0-9]+)/i);
    const slug = parts ? `${parts[1]}${parts[2]}` : slugify(title);
    const tags = [...html.matchAll(/<a[^>]*\/problemset\/tag\/[^"]+"[^>]*>([^<]+)</g)].map((m) => strip(m[1] ?? ""));
    return baseDomProblem("codeforces", slug, title, url, strip(firstMatch(html, /(\d{3,4})/) ?? "unknown"), tags.slice(0, 6));
  }
  if (host.includes("atcoder.jp") && url.includes("/tasks/")) return parseAtCoderProblemPage(html, url);
  if (host.includes("geeksforgeeks.org")) return parseGfgProblemPage(html, url);
  if (host.includes("cses.fi")) return parseCsesProblemPage(html, url);
  if (host.includes("codechef.com")) return parseCodeChefProblemPage(html, url);
  if (host.includes("hackerrank.com")) return parseHackerRankProblemPage(html, url);
  if (host.includes("interviewbit.com")) return parseInterviewBitProblemPage(html, url);
  return null;
};

export class AtCoderScraper {
  async userSubmissions(username: string, limit = 50): Promise<Problem[]> {
    const url = `https://atcoder.jp/users/${username}/history/json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`AtCoder history failed: HTTP ${response.status}`);
    const data = (await response.json()) as Array<{ problem_id: string; result: string; problem_url: string }>;
    return data
      .filter((row) => row.result === "AC")
      .slice(0, limit)
      .map((row) => ({
        id: stableId("atcoder", row.problem_id),
        platform: "atcoder",
        platformId: row.problem_id,
        title: row.problem_id,
        url: `https://atcoder.jp${row.problem_url}`,
        difficulty: "unknown",
        topics: [],
        patterns: [],
        companies: [],
        level: "atcoder",
        status: "solved",
        attempts: 1,
        confidence: 75,
        notes: "",
        mistakes: [],
        source: "atcoder-scrape"
      }));
  }
}

const baseDomProblem = (platform: Platform, slug: string, title: string, url: string, difficulty: string, topics: string[]): Problem => ({
  id: stableId(platform, slug),
  platform,
  platformId: slug,
  title,
  url,
  difficulty,
  topics,
  patterns: [],
  companies: [],
  level: platform,
  status: "unseen",
  attempts: 0,
  confidence: 0,
  notes: "",
  mistakes: [],
  source: `${platform}-dom`
});

const documentTitle = (html: string, suffix: string) => strip(firstMatch(html, /<title>([^<]+)<\/title>/) ?? suffix).replace(new RegExp(`\\s*-?\\s*${suffix}.*$`, "i"), "");
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const strip = (value: string) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const firstMatch = (value: string, pattern: RegExp) => value.match(pattern)?.[1];
const splitList = (value = "") => value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
const splitCsvLine = (line: string) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));

export {
  diffNewProblemIds,
  fetchCodeforcesFeed,
  fetchLeetCodeFeed,
  mapCodeforcesApiProblem,
  mapLeetCodeQuestion,
  type FeedManifest,
  type FeedPlatformManifest,
  type ProblemFeedCache
} from "./feed.js";
