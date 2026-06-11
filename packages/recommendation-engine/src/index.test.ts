import { describe, expect, it } from "vitest";
import { emptyWorkspace } from "@cp-forge/schemas";
import { problemBank } from "@cp-forge/sheet-engine";
import { recommendNext } from "./index";

describe("recommendation engine", () => {
  it("explains why the next problem is recommended", () => {
    const workspace = emptyWorkspace({ goal: "amazon" });
    workspace.problems = problemBank.slice(0, 3);
    const rec = recommendNext(workspace, workspace.profile);
    expect(rec.reason.length).toBeGreaterThan(20);
  });
});
