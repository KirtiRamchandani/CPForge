import type { RoadmapNode, WorkspaceData } from "@cp-forge/schemas";
import { problemBank } from "@cp-forge/sheet-engine";
import { addDays, isoDate, stableId } from "@cp-forge/utils";

export interface RoadmapOptions {
  goal: string;
  days?: number;
  level?: string;
  company?: string;
  targetRating?: number;
  weakTopics?: string[];
  workspace?: WorkspaceData;
}

export const dsaMindmap: RoadmapNode = {
  id: "dsa",
  title: "DSA",
  description: "A skill tree for coding interviews and daily problem solving.",
  type: "root",
  status: "in_progress",
  progress: 18,
  prerequisites: [],
  linkedProblems: [],
  linkedSheets: ["sheets/dsa/topic-wise-dsa.csv"],
  notes: "Master patterns, not just topic names.",
  children: [
    topic("arrays", "Arrays", ["prefix-sum", "two-pointers", "sliding-window"]),
    topic("trees", "Trees", ["traversals", "bst", "lca"]),
    topic("graphs", "Graphs", ["bfs", "dfs", "dijkstra", "dsu"]),
    topic("dynamic-programming", "Dynamic Programming", ["1d-dp", "2d-dp", "knapsack", "lis", "tree-dp"])
  ]
};

export const cpMindmap: RoadmapNode = {
  id: "cp",
  title: "Competitive Programming",
  description: "A rating-aware path from Codeforces 800 to ICPC Advanced.",
  type: "root",
  status: "in_progress",
  progress: 12,
  prerequisites: [],
  linkedProblems: [],
  linkedSheets: ["sheets/cp/topic-wise-cp.csv"],
  notes: "Contest, upsolve, review, repeat.",
  children: ["Newbie", "Pupil", "Specialist", "Expert", "Candidate Master", "Master", "ICPC Advanced"].map((level) => ({
    id: stableId("cp", level),
    title: level,
    description: `Master the ${level} layer with contests, upsolves, and targeted drills.`,
    type: "level",
    status: level === "Newbie" ? "in_progress" : "locked",
    progress: level === "Newbie" ? 35 : 0,
    children: [],
    prerequisites: [],
    linkedProblems: [],
    linkedSheets: ["sheets/cp/topic-wise-cp.csv"],
    notes: ""
  }))
};

export const generateRoadmapPlan = (options: RoadmapOptions) => {
  const days = options.days ?? 45;
  const goal = options.goal.toLowerCase();
  const focusTopics = options.weakTopics?.length
    ? options.weakTopics
    : goal === "amazon"
      ? ["arrays", "sliding-window", "trees", "graphs", "dynamic-programming"]
      : ["arrays", "graphs", "dynamic-programming", "binary-search"];

  const baseMindmap = goal === "cp" ? cpMindmap : decorateWeakNodes(dsaMindmap, focusTopics);
  const mindmap = options.workspace ? applyWorkspaceProgress(baseMindmap, options.workspace) : baseMindmap;

  return {
    goal,
    days,
    topicOrder: focusTopics,
    dailyPlan: Array.from({ length: Math.min(days, 14) }, (_, index) => ({
      day: index + 1,
      date: addDays(isoDate(), index),
      focus: focusTopics[index % focusTopics.length],
      tasks: [
        "1 warmup problem",
        "2 focused problems",
        "1 review problem",
        "1 upsolve or mistake reflection"
      ]
    })),
    weeklyMilestones: Array.from({ length: Math.ceil(days / 7) }, (_, index) => ({
      week: index + 1,
      milestone: `Finish ${focusTopics[index % focusTopics.length]} practice block and upsolve all failed problems.`
    })),
    requiredProblems: problemBank.filter((problem) => problem.topics.some((topic) => focusTopics.includes(topic))).slice(0, 12),
    reviewCheckpoints: [1, 3, 7, 14, 30].filter((interval) => interval <= days),
    mindmap
  };
};

export const applyWorkspaceProgress = (root: RoadmapNode, workspace: WorkspaceData): RoadmapNode => {
  const solved = new Set(workspace.problems.filter((p) => p.status === "solved" || p.status === "mastered").map((p) => p.id));
  const inProgress = new Set(workspace.problems.filter((p) => p.status === "solving" || p.status === "attempted").map((p) => p.id));

  const walk = (node: RoadmapNode): RoadmapNode => {
    const linked = node.linkedProblems.filter((id) => solved.has(id));
    const linkedTotal = node.linkedProblems.length || 1;
    const progress = Math.round((linked.length / linkedTotal) * 100);
    const status =
      linked.length === linkedTotal && linkedTotal > 0
        ? "mastered"
        : linked.length > 0
          ? "in_progress"
          : node.linkedProblems.some((id) => inProgress.has(id))
            ? "in_progress"
            : node.status;

    return {
      ...node,
      progress: Math.max(node.progress, progress),
      status,
      children: node.children.map(walk)
    };
  };

  return walk(root);
};

export const toggleNodeProgress = (root: RoadmapNode, nodeId: string): RoadmapNode => {
  const walk = (node: RoadmapNode): RoadmapNode => {
    if (node.id === nodeId) {
      const nextProgress = node.progress >= 100 ? 0 : Math.min(100, node.progress + 25);
      return {
        ...node,
        progress: nextProgress,
        status: nextProgress >= 100 ? "mastered" : nextProgress > 0 ? "in_progress" : "unseen"
      };
    }
    return { ...node, children: node.children.map(walk) };
  };
  return walk(root);
};

function topic(id: string, title: string, patterns: string[]): RoadmapNode {
  return {
    id,
    title,
    description: `${title} patterns, implementation traps, and revision checkpoints.`,
    type: "topic",
    status: "unseen",
    progress: 0,
    prerequisites: [],
    linkedProblems: problemBank.filter((problem) => problem.topics.includes(id)).map((problem) => problem.id),
    linkedSheets: ["sheets/dsa/topic-wise-dsa.csv"],
    notes: "",
    children: patterns.map((patternId) => ({
      id: patternId,
      title: titleCase(patternId),
      description: `Practice ${titleCase(patternId)} until you can identify it from constraints.`,
      type: "pattern",
      status: "unseen",
      progress: 0,
      children: [],
      prerequisites: [],
      linkedProblems: problemBank.filter((problem) => problem.patterns.includes(patternId)).map((problem) => problem.id),
      linkedSheets: ["sheets/dsa/pattern-wise-dsa.csv"],
      notes: ""
    }))
  };
}

const decorateWeakNodes = (root: RoadmapNode, weakTopics: string[]): RoadmapNode => ({
  ...root,
  children: root.children.map((node) => ({
    ...node,
    status: weakTopics.includes(node.id) ? "weak" : node.status,
    notes: weakTopics.includes(node.id) ? "Marked weak by recommendation engine." : node.notes
  }))
});

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
