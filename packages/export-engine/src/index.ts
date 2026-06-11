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

export const mindmapToHtml = (node: RoadmapNode): string => mindmapToInteractiveHtml(node);

export const mindmapToInteractiveHtml = (node: RoadmapNode): string => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CP Forge Skill Tree</title>
  <style>
    :root { --bg:#080b13; --panel:#0f1728; --line:#263451; --accent:#42d392; --text:#e9f1ff; --muted:#8fa3c4; }
    *{box-sizing:border-box}
    body{margin:0;background:radial-gradient(circle at 20% 0%,#1a2844,var(--bg));color:var(--text);font-family:Inter,system-ui,sans-serif}
    header{padding:32px 32px 0;max-width:1200px;margin:0 auto}
    h1{margin:0 0 8px;font-size:32px}
    .sub{color:var(--muted);margin:0 0 24px}
    main{max-width:1200px;margin:0 auto;padding:24px 32px 48px;display:grid;grid-template-columns:1fr 320px;gap:24px}
    .tree{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:16px}
    .detail{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:20px;position:sticky;top:24px;height:fit-content}
    details{margin:8px 0;border:1px solid var(--line);border-radius:8px;padding:8px 12px;background:#0b1220}
    summary{cursor:pointer;font-weight:600;list-style:none;display:flex;align-items:center;gap:8px}
    summary::-webkit-details-marker{display:none}
    .badge{font-size:10px;text-transform:uppercase;color:#8bd3ff;margin-left:auto}
    .bar{height:6px;background:#1b2942;border-radius:999px;overflow:hidden;margin:8px 0}
    .bar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),#8bd3ff);transition:width .3s}
    button.toggle{margin-top:6px;padding:6px 10px;border-radius:6px;border:1px solid #2b3a58;background:#17233a;color:var(--text);cursor:pointer;font-size:12px}
    button.toggle:hover{border-color:var(--accent)}
    #detail-title{font-size:20px;margin:0 0 8px}
    #detail-body{color:var(--muted);line-height:1.5;font-size:14px}
    .pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#17233a;border:1px solid #2b3a58;font-size:12px;margin:4px 4px 0 0}
  </style>
</head>
<body>
  <header>
    <h1>CP Forge Skill Tree</h1>
    <p class="sub">Click nodes to inspect · Toggle progress · Saved locally in this browser</p>
  </header>
  <main>
    <section class="tree" id="tree">${nodeToInteractiveHtml(node)}</section>
    <aside class="detail">
      <h2 id="detail-title">Select a node</h2>
      <p id="detail-body">Explore your DSA/CP roadmap. Progress toggles persist in localStorage.</p>
    </aside>
  </main>
  <script>
    const KEY = 'cp-forge-mindmap-progress';
    const store = JSON.parse(localStorage.getItem(KEY) || '{}');
    function save(){ localStorage.setItem(KEY, JSON.stringify(store)); }
    function renderDetail(el){
      document.getElementById('detail-title').textContent = el.dataset.title;
      document.getElementById('detail-body').innerHTML =
        '<p>' + (el.dataset.desc || '') + '</p>' +
        '<p><span class="pill">' + el.dataset.status + '</span><span class="pill">' + el.dataset.progress + '%</span></p>';
    }
    document.querySelectorAll('[data-node-id]').forEach(function(el){
      const id = el.dataset.nodeId;
      if(store[id] !== undefined){
        const bar = el.querySelector('.bar i');
        if(bar) bar.style.width = store[id] + '%';
        el.dataset.progress = store[id];
      }
      el.addEventListener('click', function(e){
        if(e.target.tagName === 'BUTTON') return;
        renderDetail(el);
      });
      const btn = el.querySelector('button.toggle');
      if(btn) btn.addEventListener('click', function(){
        const cur = Number(el.dataset.progress || 0);
        const next = cur >= 100 ? 0 : Math.min(100, cur + 25);
        el.dataset.progress = String(next);
        const bar = el.querySelector('.bar i');
        if(bar) bar.style.width = next + '%';
        store[id] = next;
        save();
        renderDetail(el);
      });
    });
  </script>
</body>
</html>`;

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

export const problemsToNotionMarkdown = (problems: Problem[]): string =>
  [
    "# CP Forge Problem Sheet",
    "",
    "| Problem | Platform | Difficulty | Topics | Status | Notes |",
    "| --- | --- | --- | --- | --- | --- |",
    ...problems.map(
      (problem) =>
        `| [${problem.title}](${problem.url}) | ${problem.platform} | ${problem.difficulty} | ${problem.topics.join(", ")} | ${problem.status} | ${problem.notes.replace(/\n/g, " ")} |`
    )
  ].join("\n");

export const problemsToObsidianNotes = (problems: Problem[]): string =>
  problems
    .map(
      (problem) =>
        `---
platform: ${problem.platform}
url: ${problem.url}
difficulty: ${problem.difficulty}
topics: [${problem.topics.join(", ")}]
patterns: [${problem.patterns.join(", ")}]
status: ${problem.status}
confidence: ${problem.confidence}
review_date: ${problem.reviewDate ?? ""}
---

# ${problem.title}

## Approach

## Mistakes

## Edge Cases

## Complexity

## Review Notes
${problem.notes ? `\n${problem.notes}\n` : ""}`
    )
    .join("\n\n---\n\n");

export const buildDashboardPayload = (workspace: WorkspaceData, extras: Record<string, unknown> = {}): string =>
  JSON.stringify({ workspace, ...extras }, null, 2);

export const vscodeWorkspaceConfig = (language = "cpp"): string =>
  JSON.stringify(
    {
      folders: [{ path: "." }],
      settings: {
        "files.exclude": { "**/.cpforge/cache": true },
        "cpForge.preferredLanguage": language
      },
      extensions: {
        recommendations: ["cp-forge.vscode-extension"]
      }
    },
    null,
    2
  );

export const extensionImportBundle = (workspace: WorkspaceData): string =>
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      source: "cp-forge-cli",
      sessions: Object.fromEntries(
        workspace.problems.slice(0, 100).map((problem) => [
          problem.url,
          {
            url: problem.url,
            title: problem.title,
            platform: problem.platform,
            status: problem.status,
            notes: problem.notes,
            updatedAt: new Date().toISOString()
          }
        ])
      )
    },
    null,
    2
  );

export const dailyPlanToMarkdown = (plan: {
  warmup: { title: string };
  main: Array<{ title: string; url?: string }>;
  reviewProblemId?: string;
  upsolveProblemId?: string;
  reflection: string;
}): string =>
  [
    "# Today's CP Forge Plan",
    "",
    "## Warmup",
    `- ${plan.warmup.title}`,
    "",
    "## Main",
    ...plan.main.map((problem) => `- ${problem.title}`),
    "",
    "## Review",
    `- ${plan.reviewProblemId ?? "Schedule after first solve"}`,
    "",
    "## Upsolve",
    `- ${plan.upsolveProblemId ?? "Queue is clear"}`,
    "",
    "## Reflection",
    `- ${plan.reflection}`
  ].join("\n");

const nodeToHtml = (node: RoadmapNode): string => nodeToInteractiveHtml(node);

const nodeToInteractiveHtml = (node: RoadmapNode): string => `<details open>
  <summary data-node-id="${escapeAttr(node.id)}" data-title="${escapeAttr(node.title)}" data-desc="${escapeAttr(node.description)}" data-status="${escapeAttr(node.status)}" data-progress="${node.progress}">
    ${escapeHtml(node.title)} <span class="badge">${node.status.replaceAll("_", " ")}</span>
  </summary>
  <div data-node-id="${escapeAttr(node.id)}" data-title="${escapeAttr(node.title)}" data-desc="${escapeAttr(node.description)}" data-status="${escapeAttr(node.status)}" data-progress="${node.progress}">
    <p style="color:#9eb0cf;font-size:13px;margin:6px 0">${escapeHtml(node.description)}</p>
    <div class="bar"><i style="width:${node.progress}%"></i></div>
    <button class="toggle" type="button">Mark progress +25%</button>
    ${node.children.map(nodeToInteractiveHtml).join("")}
  </div>
</details>`;

const valueFor = (problem: Problem, key: string): unknown => {
  if (key === "review_date") return problem.reviewDate ?? "";
  const value = problem[key as keyof Problem];
  return Array.isArray(value) ? value.join(";") : value ?? "";
};

const csvValue = (value: unknown): string => `"${String(value).replaceAll('"', '""')}"`;
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const escapeAttr = (value: string): string => escapeHtml(value).replace(/`/g, "&#96;");
const escapeXml = escapeHtml;
