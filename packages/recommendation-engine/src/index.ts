import type { Problem, Profile, Recommendation, WorkspaceData } from "@cp-forge/schemas";
import { problemBank } from "@cp-forge/sheet-engine";
import { addDays, groupBy, isoDate, stableId } from "@cp-forge/utils";

export interface WeakArea {
  topic: string;
  reason: string;
  evidence: number;
}

export const detectWeakAreas = (workspace: WorkspaceData): WeakArea[] => {
  const mistakeTopics = workspace.mistakes.flatMap((mistake) => [mistake.topic, mistake.pattern, mistake.category].filter(Boolean));
  const counts = Object.entries(groupBy(mistakeTopics, String)).map(([topic, entries]) => ({
    topic,
    reason: `${entries.length} mistake${entries.length === 1 ? "" : "s"} linked to ${topic}.`,
    evidence: entries.length
  }));

  if (counts.length > 0) {
    return counts.sort((a, b) => b.evidence - a.evidence).slice(0, 5);
  }

  return [
    {
      topic: "sliding-window",
      reason: "Default diagnostic: high-frequency interview pattern with low solved coverage in the starter data.",
      evidence: 1
    },
    {
      topic: "dynamic-programming",
      reason: "Default diagnostic: most learners delay DP, so CP Forge schedules it early.",
      evidence: 1
    },
    {
      topic: "trees",
      reason: "Default diagnostic: tree implementation mistakes are common in interviews and CP.",
      evidence: 1
    }
  ];
};

export const recommendNext = (workspace: WorkspaceData, profile: Profile): Recommendation => {
  const overdue = workspace.reviews.find((review) => !review.completed && review.dueDate <= isoDate());
  if (overdue) {
    return {
      id: stableId("rec", "review", overdue.problemId),
      type: "review",
      title: "Review overdue problem",
      reason: "Review is overdue, and review debt should be cleared before adding new problems.",
      priority: "critical",
      action: `Review ${overdue.problemId}`,
      estimatedTime: "25min",
      problemId: overdue.problemId
    };
  }

  const upsolve = workspace.upsolve.find((item) => !item.completed);
  if (upsolve) {
    return {
      id: stableId("rec", "upsolve", upsolve.problemId),
      type: "upsolve",
      title: "Upsolve your highest-signal failed problem",
      reason: upsolve.reason,
      priority: upsolve.priority,
      action: `Upsolve ${upsolve.problemId}`,
      estimatedTime: "60min",
      problemId: upsolve.problemId
    };
  }

  const weak = detectWeakAreas(workspace)[0];
  const candidate = pickProblemForWeakArea(weak.topic, profile.goal);
  return {
    id: stableId("rec", "problem", candidate.id),
    type: "problem",
    title: candidate.title,
    reason: `This targets ${weak.topic}: ${weak.reason}`,
    priority: "high",
    action: `Solve ${candidate.title}`,
    estimatedTime: candidate.rating && candidate.rating >= 1600 ? "75min" : "45min",
    problemId: candidate.id
  };
};

export const buildDailyPlan = (workspace: WorkspaceData, profile: Profile) => {
  const weak = detectWeakAreas(workspace);
  const next = recommendNext(workspace, profile);
  const warmup = pickProblemForWeakArea("arrays", profile.goal);
  const main = weak.slice(0, 2).map((area) => pickProblemForWeakArea(area.topic, profile.goal));
  const review = workspace.reviews.find((item) => !item.completed);
  const upsolve = workspace.upsolve.find((item) => !item.completed);

  return {
    date: isoDate(),
    warmup,
    main,
    reviewProblemId: review?.problemId,
    upsolveProblemId: upsolve?.problemId,
    reflection: "Write one mistake you avoided today and one edge case you checked.",
    nextReviewDate: addDays(isoDate(), 1),
    nextAction: next
  };
};

export const buildWeeklyPlan = (workspace: WorkspaceData, profile: Profile) =>
  Array.from({ length: 7 }, (_, index) => ({
    day: index + 1,
    date: addDays(isoDate(), index),
    focus: detectWeakAreas(workspace)[index % detectWeakAreas(workspace).length]?.topic ?? profile.goal,
    task: index % 3 === 2 ? "Review and upsolve before new problems" : "Solve targeted problems with notes"
  }));

export interface CompanyPlanBlock {
  days: number;
  title: string;
  focus: string[];
  milestones: string[];
  mustSolve: string[];
  mockChecklist: string[];
}

const companyPatterns: Record<string, string[]> = {
  amazon: ["arrays", "sliding-window", "trees", "graphs", "heap", "dynamic-programming"],
  microsoft: ["arrays", "strings", "trees", "graphs", "dynamic-programming", "system-design-prep"],
  google: ["graphs", "dynamic-programming", "greedy", "binary-search", "math"],
  meta: ["arrays", "strings", "trees", "graphs", "dynamic-programming"],
  netflix: ["arrays", "hashing", "system-design-prep"],
  flipkart: ["arrays", "dynamic-programming", "graphs"],
  uber: ["graphs", "heap", "dynamic-programming", "greedy"],
  adobe: ["arrays", "strings", "dynamic-programming"],
  goldmansachs: ["math", "dynamic-programming", "greedy"],
  jpmorgan: ["math", "arrays", "dynamic-programming"],
  atlassian: ["arrays", "graphs", "dynamic-programming"],
  oracle: ["arrays", "sql-prep", "dynamic-programming"],
  salesforce: ["arrays", "strings", "dynamic-programming"],
  walmart: ["arrays", "greedy", "dynamic-programming"],
  default: ["arrays", "strings", "trees", "graphs", "dynamic-programming"]
};

export const buildCompanyPlan = (company: string, days: number): CompanyPlanBlock => {
  const key = company.toLowerCase().replace(/[^a-z]/g, "");
  const patterns = companyPatterns[key] ?? companyPatterns.default;
  const weekCount = Math.ceil(days / 7);
  return {
    days,
    title: `${company} ${days}-day interview prep`,
    focus: patterns,
    milestones: Array.from({ length: Math.min(weekCount, 8) }, (_, i) => `Week ${i + 1}: ${patterns[i % patterns.length]} + ${i % 2 === 0 ? "2 mediums" : "1 review block"}`),
    mustSolve: problemBank
      .filter((p) => p.companies.includes(key) || patterns.some((pat) => p.topics.includes(pat) || p.patterns.some((x) => x.includes(pat))))
      .slice(0, 12)
      .map((p) => p.title),
    mockChecklist: [
      "Explain approach before coding",
      "State time/space complexity",
      "Walk through 2 edge cases",
      "Compare brute force vs optimized",
      "Mention trade-offs if follow-up asked"
    ]
  };
};

export const buildCompanyPlans = (company: string): CompanyPlanBlock[] => [30, 45, 60].map((days) => buildCompanyPlan(company, days));

const pickProblemForWeakArea = (topic: string, goal: string): Problem => {
  const exact = problemBank.find((problem) => problem.topics.includes(topic) || problem.patterns.includes(topic));
  if (exact) return exact;
  return problemBank.find((problem) => problem.companies.includes(goal) || problem.companies.includes(goal.toLowerCase())) ?? problemBank[0];
};
