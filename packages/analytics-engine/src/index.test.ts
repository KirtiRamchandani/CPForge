import { describe, expect, it } from "vitest";
import { analyzeWorkspace, computeAchievements } from "./index";
import { emptyWorkspace, problemSchema } from "@cp-forge/schemas";

describe("computeAchievements", () => {
  it("unlocks first-10 when enough solves", () => {
    const workspace = emptyWorkspace();
    const base = problemSchema.parse({
      id: "test-1",
      platform: "leetcode",
      platformId: "two-sum",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      difficulty: "easy",
      topics: ["arrays"],
      patterns: [],
      companies: [],
      level: "easy",
      status: "solved",
      attempts: 1,
      confidence: 80,
      notes: "",
      mistakes: [],
      source: "test"
    });
    workspace.problems = Array.from({ length: 12 }, (_, i) => ({ ...base, id: `p-${i}`, platformId: `p-${i}` }));
    const analytics = analyzeWorkspace(workspace);
    const badges = computeAchievements(workspace, analytics);
    expect(badges.find((b) => b.id === "first-10")?.unlocked).toBe(true);
  });
});
