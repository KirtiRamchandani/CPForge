import { describe, expect, it } from "vitest";
import { emptyWorkspace, problemSchema } from "./index";

describe("schemas", () => {
  it("creates a default local-first workspace", () => {
    const workspace = emptyWorkspace({ goal: "amazon" });
    expect(workspace.profile.goal).toBe("amazon");
    expect(workspace.problems).toEqual([]);
  });

  it("validates a tracked problem", () => {
    const problem = problemSchema.parse({
      id: "lc-two-sum",
      platform: "leetcode",
      platformId: "1",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      topics: ["arrays"],
      patterns: ["hash map"]
    });
    expect(problem.status).toBe("unseen");
  });
});
