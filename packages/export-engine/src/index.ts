import type { Mistake, Problem, Recommendation, ReviewItem, RoadmapNode, WorkspaceData } from "@cp-forge/schemas";

export const problemsToCsv = (problems: Problem[]): string => {
  const header = [
    "id",
    "platform",
    "title",
    "url",
    "difficulty",
    "rating",
    "topics",
    "patterns",
    "companies",
    "level",
    "status",
    "attempts",
    "confidence",
    "notes",
    "review_date"
  ];
  return [header.join(","), ...problems.map((problem) => header.map((key) => csvValue(valueFor(problem, key))).join(","))].join("\n");
};

export const problemsToMarkdown = (problems: Problem[]): string =>
  [
    "| Problem | Platform | Difficulty | Topics | Status | Why it matters |",
    "| --- | --- | --- | --- | --- | --- |",
    ...problems.map(
      (problem) =>
        `| [${problem.title}](${problem.url}) | ${problem.platform} | ${problem.difficulty} | ${problem.topics.join(", ")} | ${problem.status} | ${problem.patterns.join(", ") || "Core practice"} |`
    )
  ].join("\n");

export const reviewsToIcs = (reviews: ReviewItem[]): string =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CP Forge//Review Scheduler//EN",
    ...reviews.flatMap((review) => [
      "BEGIN:VEVENT",
      `UID:${review.id}@cp-forge`,
      `DTSTAMP:${review.dueDate.replaceAll("-", "")}T090000Z`,
      `DTSTART:${review.dueDate.replaceAll("-", "")}T090000Z`,
      `SUMMARY:CP Forge Review - ${review.problemId}`,
      `DESCRIPTION:${review.reason}`,
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ].join("\n");

export const mindmapToMarkdown = (node: RoadmapNode, depth = 0): string => {
  const prefix = "  ".repeat(depth);
  return [`${prefix}- [${node.status}] ${node.title} (${node.progress}%)`, ...node.children.map((child) => mindmapToMarkdown(child, depth + 1))].join("\n");
};

export const mindmapToHtml = (node: RoadmapNode): string => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CP Forge Mindmap</title>
  <style>
    body{margin:0;background:#0b1020;color:#e6edf7;font-family:Inter,system-ui,sans-serif}
    main{max-width:1100px;margin:0 auto;padding:32px}
    details{margin:10px 0;padding:10px 14px;border:1px solid #26324d;border-radius:8px;background:#111a2e}
    summary{cursor:pointer;font-weight:700}
    .bar{height:8px;background:#23314f;border-radius:999px;overflow:hidden;margin:8px 0}
    .bar span{display:block;height:100%;background:#42d392}
    .status{color:#8bd3ff;font-size:12px;text-transform:uppercase}
  </style>
</head>
<body><main><h1>CP Forge Mindmap</h1>${nodeToHtml(node)}</main></body></html>`;

export const chartToSvg = (data: Record<string, number>, title = "CP Forge Chart"): string => {
  const entries = Object.entries(data).slice(0, 8);
  const width = 760;
  const height = 360;
  const max = Math.max(1, ...entries.map(([, value]) => value));
  const bars = entries
    .map(([label, value], index) => {
      const barWidth = Math.round((value / max) * 520);
      const y = 74 + index * 34;
      return `<text x="24" y="${y + 16}" fill="#d8e3f8" font-size="13">${escapeXml(label)}</text><rect x="210" y="${y}" width="${barWidth}" height="20" rx="5" fill="#42d392"/><text x="${220 + barWidth}" y="${y + 15}" fill="#9fb1d1" font-size="12">${value}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" rx="16" fill="#0b1020"/><text x="24" y="42" fill="#ffffff" font-size="24" font-family="Inter,Arial">${escapeXml(title)}</text>${bars}</svg>`;
};

export const workspaceToJson = (workspace: WorkspaceData): string => JSON.stringify(workspace, null, 2);

export const recommendationsToMarkdown = (items: Recommendation[]): string =>
  items.map((item) => `- **${item.title}** (${item.priority}): ${item.reason}\n  Action: ${item.action}`).join("\n");

export const mistakesToAnkiCsv = (mistakes: Mistake[]): string => {
  const header = "Front,Back,Tags";
  const rows = mistakes.map((mistake) => {
    const front = `What went wrong on ${mistake.title}?`;
    const back = mistake.fix ?? mistake.description ?? mistake.category;
    const tags = [mistake.topic, mistake.pattern, mistake.category].filter(Boolean).join(" ");
    return `${csvValue(front)},${csvValue(back)},${csvValue(tags)}`;
  });
  return [header, ...rows].join("\n");
};

export const mistakesToFlashcardsMarkdown = (mistakes: Mistake[]): string =>
  mistakes
    .map(
      (mistake) =>
        `## ${mistake.title}\n\n**Q:** What mistake happened on ${mistake.problemId}?\n\n**A:** ${mistake.fix ?? mistake.description ?? mistake.category}\n`
    )
    .join("\n");

const nodeToHtml = (node: RoadmapNode): string => `<details open>
  <summary>${escapeHtml(node.title)} <span class="status">${node.status}</span></summary>
  <p>${escapeHtml(node.description)}</p>
  <div class="bar"><span style="width:${node.progress}%"></span></div>
  ${node.children.map(nodeToHtml).join("")}
</details>`;

const valueFor = (problem: Problem, key: string): unknown => {
  if (key === "review_date") return problem.reviewDate ?? "";
  const value = problem[key as keyof Problem];
  return Array.isArray(value) ? value.join(";") : value ?? "";
};

const csvValue = (value: unknown): string => `"${String(value).replaceAll('"', '""')}"`;
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const escapeXml = escapeHtml;
