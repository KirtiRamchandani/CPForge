import { analyzeWorkspace } from "@cp-forge/analytics-engine";
import { buildDailyPlan, detectWeakAreas, recommendNext } from "@cp-forge/recommendation-engine";
import { generateRoadmapPlan } from "@cp-forge/roadmap-engine";
import { problemBank } from "@cp-forge/sheet-engine";
import type { Profile, WorkspaceData } from "@cp-forge/schemas";
import { emptyWorkspace } from "@cp-forge/schemas";

export interface LaunchOptions {
  profile?: Partial<Profile>;
  days?: number;
  offline?: boolean;
}

export const createWorkspace = (profile?: Partial<Profile>): WorkspaceData => {
  const workspace = emptyWorkspace(profile);
  workspace.problems = problemBank.slice(0, 60);
  return workspace;
};

export const buildLaunchReport = (workspace: WorkspaceData, options: LaunchOptions = {}) => {
  const profile = { ...workspace.profile, ...options.profile };
  const days = options.days ?? profile.interviewTimelineDays ?? 45;
  const analytics = analyzeWorkspace({ ...workspace, profile });
  const weakAreas = detectWeakAreas(workspace);
  const roadmap = generateRoadmapPlan({
    goal: profile.goal,
    days,
    company: profile.targetCompanies[0],
    weakTopics: weakAreas.map((area) => area.topic)
  });
  const dailyPlan = buildDailyPlan(workspace, profile);
  const next = recommendNext(workspace, profile);

  return {
    title: "CP Forge Report",
    goal: profile.goal,
    timelineDays: days,
    language: profile.preferredLanguage,
    strengths: analytics.strongTopics,
    weakAreas,
    roadmap,
    dailyPlan,
    next,
    generated: [
      `${days}-day ${profile.goal} plan`,
      "Personalized problem sheet",
      "Review calendar",
      "Mistake tracker",
      "Upsolve queue",
      "Dashboard data",
      "Markdown export",
      "Google Sheets CSV",
      "Obsidian notes",
      "GitHub portfolio report"
    ]
  };
};
