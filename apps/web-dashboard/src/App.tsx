import { analyzeWorkspace } from "@cp-forge/analytics-engine";
import { buildLaunchReport, createWorkspace } from "@cp-forge/core";
import { portfolioMarkdown } from "@cp-forge/portfolio-engine";
import { buildDailyPlan, buildWeeklyPlan, detectWeakAreas } from "@cp-forge/recommendation-engine";
import { generateRoadmapPlan, toggleNodeProgress } from "@cp-forge/roadmap-engine";
import type { RoadmapNode, WorkspaceData } from "@cp-forge/schemas";
import { problemBank } from "@cp-forge/sheet-engine";
import { ActivityGrid, BarChart, MindmapTree, StatCard } from "@cp-forge/ui";
import { useCallback, useMemo, useRef, useState } from "react";

const nav = [
  "Home",
  "Today",
  "Progress",
  "Roadmaps",
  "Mindmap",
  "Sheets",
  "Charts",
  "Contests",
  "Weaknesses",
  "Mistakes",
  "Upsolve",
  "Reviews",
  "Companies",
  "Platforms",
  "Portfolio",
  "Notes",
  "Settings"
];

interface DashboardPayload {
  workspace: WorkspaceData;
  analytics?: ReturnType<typeof analyzeWorkspace>;
  today?: ReturnType<typeof buildDailyPlan>;
  weekly?: ReturnType<typeof buildWeeklyPlan>;
  weakAreas?: ReturnType<typeof detectWeakAreas>;
}

export const App = () => {
  const [active, setActive] = useState("Home");
  const [mindmapOverride, setMindmapOverride] = useState<RoadmapNode | undefined>();
  const [payload, setPayload] = useState<DashboardPayload>(() => buildPayload(createWorkspace({ goal: "amazon", targetCompanies: ["amazon"], preferredLanguage: "cpp" })));
  const fileInput = useRef<HTMLInputElement>(null);

  const { workspace, analytics, today, weekly, weakAreas, roadmap, report } = useMemo(() => {
    const ws = payload.workspace;
    const areas = payload.weakAreas ?? detectWeakAreas(ws);
    const plan = generateRoadmapPlan({
      goal: ws.profile.goal,
      days: ws.profile.interviewTimelineDays,
      weakTopics: areas.map((area) => area.topic),
      workspace: ws
    });
    return {
      workspace: ws,
      analytics: payload.analytics ?? analyzeWorkspace(ws),
      today: payload.today ?? buildDailyPlan(ws, ws.profile),
      weekly: payload.weekly ?? buildWeeklyPlan(ws, ws.profile),
      weakAreas: areas,
      roadmap: plan,
      report: buildLaunchReport(ws, { days: ws.profile.interviewTimelineDays, profile: ws.profile, offline: true })
    };
  }, [payload]);

  const mindmap = mindmapOverride ?? roadmap.mindmap;

  const importFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as DashboardPayload;
    if (!parsed.workspace?.profile) throw new Error("Invalid dashboard export");
    setPayload(buildPayload(parsed.workspace, parsed));
  }, []);

  const goalLabel = workspace.profile.targetCompanies[0] ?? workspace.profile.goal;
  const weakestPattern = weakAreas[0]?.topic ?? analytics.weakTopics[0] ?? "None logged";
  const topMistake = workspace.mistakes[0]?.category ?? "None logged";
  const masteryPercent = analytics.readinessScore;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>CPF</span>
          <div>
            <strong>CP Forge</strong>
            <small>Training OS</small>
          </div>
        </div>
        <nav>
          {nav.map((item) => (
            <button className={active === item ? "active" : ""} key={item} onClick={() => setActive(item)} type="button">
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>Local-first dashboard · {workspace.problems.length} tracked problems</p>
            <h1>{active}</h1>
          </div>
          <div className="topbar-actions">
            <input
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importFile(file).catch(() => alert("Could not import dashboard JSON. Run `cp-forge dashboard` first."));
                event.target.value = "";
              }}
              ref={fileInput}
              type="file"
            />
            <button onClick={() => fileInput.current?.click()} type="button">
              Import .cpforge export
            </button>
          </div>
        </header>

        {active === "Home" && (
          <>
            <section className="hero-band">
              <div>
                <p>Goal: {goalLabel}</p>
                <h2>The fastest way to turn practice into measurable growth.</h2>
              </div>
              <div className="next-action">
                <span>Next action</span>
                <strong>{report.next.action}</strong>
                <p>{report.next.reason}</p>
              </div>
            </section>
            <section className="stat-grid">
              <StatCard label="DSA Mastery" value={`${masteryPercent}%`} detail="Roadmap progress with reviews" />
              <StatCard label="Solved" value={`${analytics.solvedCount}`} detail="Across all platforms" />
              <StatCard label="Readiness" value={`${analytics.readinessScore}%`} detail="Company pattern coverage" />
              <StatCard label="Review Load" value={`${analytics.reviewDueCount} due`} detail="Spaced repetition" />
              <StatCard label="Weakest Pattern" value={weakestPattern} detail="High-frequency and low coverage" />
              <StatCard label="Solve streak" value={`${analytics.solveStreakDays} days`} detail="Consistency beats cramming" />
            </section>
            <section className="two-col">
              <BarChart title="Topic Distribution" data={analytics.topicDistribution} />
              <Panel title="Coach Mode">
                {weakAreas.length ? weakAreas.map((area) => <p key={area.topic}>{area.reason}</p>) : <p>Log mistakes and solve problems to unlock coaching signals.</p>}
              </Panel>
            </section>
          </>
        )}

        {active === "Today" && (
          <Panel title="Today's CP Forge Plan">
            <Task label="Warmup" value={today.warmup.title} />
            {today.main.map((problem) => (
              <Task key={problem.id} label="Main" value={problem.title} />
            ))}
            <Task label="Review" value={today.reviewProblemId ?? "Schedule first review after solving"} />
            <Task label="Upsolve" value={today.upsolveProblemId ?? "No upsolve debt yet"} />
            <Task label="Reflection" value={today.reflection} />
          </Panel>
        )}

        {active === "Progress" && (
          <section className="two-col">
            <Panel title="Training Progress">
              <Task label="Solved" value={`${analytics.solvedCount}`} />
              <Task label="Attempted" value={`${analytics.attemptedCount}`} />
              <Task label="Streak" value={`${analytics.solveStreakDays} days`} />
              <Task label="Readiness" value={`${analytics.readinessScore}%`} />
            </Panel>
            <ActivityGrid title="Recent Activity" data={analytics.weeklyActivity} />
          </section>
        )}

        {active === "Mindmap" || active === "Roadmaps" ? (
          <section className="mindmap-layout">
            <Panel title="Skill Tree">
              <MindmapTree
                node={mindmap}
                onToggle={(id) => setMindmapOverride(toggleNodeProgress(mindmap, id))}
              />
            </Panel>
            <Panel title="Weekly Milestones">
              {weekly.map((item) => (
                <Task key={item.day} label={`Day ${item.day}`} value={`${item.focus}: ${item.task}`} />
              ))}
            </Panel>
          </section>
        ) : null}

        {active === "Sheets" && (
          <Panel title={`Problem Sheet · ${problemBank.length} curated problems`}>
            <div className="problem-table">
              {problemBank.map((problem) => (
                <a href={problem.url} key={problem.id} target="_blank" rel="noreferrer">
                  <strong>{problem.title}</strong>
                  <span>{problem.platform}</span>
                  <span>{problem.difficulty}</span>
                  <small>{problem.patterns.join(", ") || problem.topics.join(", ")}</small>
                </a>
              ))}
            </div>
          </Panel>
        )}

        {active === "Charts" && (
          <section className="two-col">
            <BarChart title="Solved By Topic" data={analytics.topicDistribution} />
            <BarChart title="Platform Mix" data={analytics.platformDistribution} />
            <BarChart title="Mistake Categories" data={analytics.mistakeDistribution} />
            <BarChart title="CF Rating Buckets" data={analytics.ratingProgress} />
            <ActivityGrid title="Solve Activity" data={analytics.weeklyActivity} />
          </section>
        )}

        {active === "Contests" && (
          <Panel title="Contest Blocks">
            {Array.isArray(workspace.contests) && workspace.contests.length ? (
              workspace.contests.map((contest, index) => (
                <Task
                  key={String((contest as { id?: string }).id ?? index)}
                  label={String((contest as { platform?: string }).platform ?? "contest")}
                  value={`${String((contest as { title?: string }).title ?? "Virtual block")} · ${((contest as { problems?: string[] }).problems ?? []).length} problems`}
                />
              ))
            ) : (
              <p>No contests yet. Run `cp-forge contest --rating 1200` or `cp-forge contest --upcoming`.</p>
            )}
          </Panel>
        )}

        {active === "Platforms" && (
          <Panel title="Platform Handles">
            <Task label="Codeforces" value={workspace.profile.codeforcesHandle ?? "Not linked — cp-forge sync --cf handle"} />
            <Task label="LeetCode" value={workspace.profile.leetcodeHandle ?? "Not linked"} />
            <Task label="AtCoder" value={workspace.profile.atcoderHandle ?? "Not linked"} />
            <BarChart title="Problems By Platform" data={analytics.platformDistribution} />
          </Panel>
        )}

        {active === "Notes" && (
          <Panel title="Problem Notes">
            <p>Notes live in `.cpforge/notes/` and sync from the VS Code / Chrome extensions.</p>
            {workspace.problems
              .filter((problem) => problem.notes)
              .slice(0, 20)
              .map((problem) => (
                <Task key={problem.id} label={problem.title} value={problem.notes} />
              ))}
          </Panel>
        )}

        {active === "Weaknesses" && (
          <Panel title="Why Am I Stuck?">
            {weakAreas.length ? weakAreas.map((area) => <Task key={area.topic} label={area.topic} value={area.reason} />) : <p>No weak areas detected yet. Keep practicing and logging mistakes.</p>}
          </Panel>
        )}

        {active === "Mistakes" && (
          <Panel title="Mistake Bank">
            {workspace.mistakes.length ? (
              workspace.mistakes.map((mistake) => (
                <div className="task-row" key={mistake.id}>
                  <span>{mistake.category}</span>
                  <strong>{mistake.title}</strong>
                  <p>{mistake.description || mistake.fix}</p>
                </div>
              ))
            ) : (
              <p>No mistakes logged yet. Use `cp-forge mistakes add` or the browser extension while solving.</p>
            )}
          </Panel>
        )}

        {active === "Upsolve" && (
          <Panel title="Upsolve Queue">
            {workspace.upsolve.length ? (
              workspace.upsolve.map((item) => (
                <Task key={item.id} label={item.priority} value={`${item.problemId} · ${item.reason}`} />
              ))
            ) : (
              <p>Upsolve queue is clear. Failed contest problems and partial solves land here automatically.</p>
            )}
          </Panel>
        )}

        {active === "Reviews" && (
          <Panel title="Spaced Reviews">
            {workspace.reviews.length ? (
              workspace.reviews.map((item) => (
                <Task key={item.id} label={item.dueDate} value={`${item.problemId} · ${item.reason}`} />
              ))
            ) : (
              <p>No reviews scheduled. Solve problems and run `cp-forge review schedule` to build retention.</p>
            )}
          </Panel>
        )}

        {active === "Companies" && (
          <Panel title="Company Readiness">
            {workspace.profile.targetCompanies.length ? (
              workspace.profile.targetCompanies.map((company) => (
                <Task
                  key={company}
                  label={company}
                  value={`${filterSheetCount(company)} problems tagged · ${analytics.readinessScore}% readiness`}
                />
              ))
            ) : (
              <p>Set a company goal with `cp-forge launch --goal amazon`.</p>
            )}
          </Panel>
        )}

        {active === "Portfolio" && (
          <Panel title="Training Portfolio">
            <pre className="portfolio-preview">{portfolioMarkdown(workspace)}</pre>
          </Panel>
        )}

        {active === "Settings" && (
          <Panel title="Profile & Privacy">
            <Task label="Language" value={workspace.profile.preferredLanguage} />
            <Task label="Goal" value={workspace.profile.goal} />
            <Task label="Daily minutes" value={`${workspace.profile.dailyAvailableMinutes}`} />
            <Task label="Timeline" value={`${workspace.profile.interviewTimelineDays} days`} />
            <Task label="Codeforces" value={workspace.profile.codeforcesHandle ?? "Not linked"} />
            <Task label="LeetCode" value={workspace.profile.leetcodeHandle ?? "Not linked"} />
            <p className="settings-note">All data stays local in `.cpforge/`. Export with `cp-forge export` anytime.</p>
          </Panel>
        )}
      </section>
    </main>
  );
};

function buildPayload(workspace: WorkspaceData, partial?: Partial<DashboardPayload>): DashboardPayload {
  return {
    workspace,
    analytics: partial?.analytics ?? analyzeWorkspace(workspace),
    today: partial?.today ?? buildDailyPlan(workspace, workspace.profile),
    weekly: partial?.weekly ?? buildWeeklyPlan(workspace, workspace.profile),
    weakAreas: partial?.weakAreas ?? detectWeakAreas(workspace)
  };
}

function filterSheetCount(company: string) {
  return problemBank.filter((problem) => problem.companies.includes(company.toLowerCase())).length;
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="panel">
    <h2>{title}</h2>
    {children}
  </section>
);

const Task = ({ label, value }: { label: string; value: string }) => (
  <div className="task-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);
