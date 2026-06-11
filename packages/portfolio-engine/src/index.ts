import { analyzeWorkspace } from "@cp-forge/analytics-engine";
import type { WorkspaceData } from "@cp-forge/schemas";

export const portfolioMarkdown = (workspace: WorkspaceData): string => {
  const analytics = analyzeWorkspace(workspace);
  return `## CP Forge Training Profile

**Current goal:** ${workspace.profile.goal}

| Metric | Value |
| --- | --- |
| Solved count | ${analytics.solvedCount} |
| Review due | ${analytics.reviewDueCount} |
| Upsolve queue | ${analytics.upsolveCount} |
| Readiness score | ${analytics.readinessScore}% |

**Strong topics:** ${analytics.strongTopics.join(", ") || "Building"}

**Weak topics to repair:** ${analytics.weakTopics.join(", ") || "No repeated mistakes logged yet"}

**Next milestone:** Reduce mistake repeats before increasing solved volume.
`;
};

export const portfolioHtml = (workspace: WorkspaceData): string =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>CP Forge Portfolio</title><style>body{font-family:Inter,system-ui;background:#0b1020;color:#eef4ff;padding:40px}article{max-width:860px;margin:auto}strong{color:#42d392}</style></head><body><article>${portfolioMarkdown(workspace)
    .replaceAll("\n", "<br/>")
    .replaceAll("**", "")}</article></body></html>`;

export const profileCardSvg = (workspace: WorkspaceData): string => {
  const analytics = analyzeWorkspace(workspace);
  const strongest = analytics.strongTopics[0] ?? "building";
  const weakest = analytics.weakTopics[0] ?? "none logged";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="220" viewBox="0 0 720 220">
  <rect width="720" height="220" rx="18" fill="#0b1020"/>
  <text x="28" y="44" fill="#ffffff" font-size="28" font-family="Inter,Arial,sans-serif" font-weight="700">CP Forge Profile</text>
  <text x="28" y="72" fill="#8bd3ff" font-size="14" font-family="Inter,Arial,sans-serif">Goal: ${escapeXml(workspace.profile.goal)}</text>
  <text x="28" y="112" fill="#d8e3f8" font-size="16" font-family="Inter,Arial,sans-serif">Solved: ${analytics.solvedCount}  |  Readiness: ${analytics.readinessScore}%</text>
  <text x="28" y="142" fill="#42d392" font-size="15" font-family="Inter,Arial,sans-serif">Strongest: ${escapeXml(strongest)}</text>
  <text x="28" y="168" fill="#ff8b8b" font-size="15" font-family="Inter,Arial,sans-serif">Weakest: ${escapeXml(weakest)}</text>
  <text x="28" y="198" fill="#9fb1d1" font-size="13" font-family="Inter,Arial,sans-serif">Review due: ${analytics.reviewDueCount}  |  Upsolve queue: ${analytics.upsolveCount}</text>
</svg>`;
};

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
