import { describe, expect, it } from "vitest";
import { emptyWorkspace } from "@cp-forge/schemas";
import { problemBank } from "@cp-forge/sheet-engine";
import { buildCompanyPlans, computeCompanyReadiness, recommendNext } from "./index";

describe("recommendation engine", () => {
  it("explains why the next problem is recommended", () => {
    const workspace = emptyWorkspace({ goal: "amazon" });
    workspace.problems = problemBank.slice(0, 3);
    const rec = recommendNext(workspace, workspace.profile);
    expect(rec.reason.length).toBeGreaterThan(20);
  });

  it("builds company plans for 30/45/60 days", () => {
    const plans = buildCompanyPlans("amazon");
    expect(plans.map((p) => p.days)).toEqual([30, 45, 60]);
  });

  it("computes company readiness radar scores", () => {
    const workspace = emptyWorkspace({ goal: "amazon", targetCompanies: ["amazon"] });
    workspace.problems = problemBank.slice(0, 10).map((p) => ({ ...p, status: "solved" as const }));
    const radar = computeCompanyReadiness(workspace, "amazon");
    expect(Object.keys(radar).length).toBeGreaterThan(3);
    expect(Object.values(radar).every((v) => v >= 0 && v <= 100)).toBe(true);
  });
});
