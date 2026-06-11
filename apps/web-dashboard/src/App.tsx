import { analyzeWorkspace, buildStuckDiagnosis } from "@cp-forge/analytics-engine";
import { buildLaunchReport, createWorkspace } from "@cp-forge/core";
import { portfolioMarkdown } from "@cp-forge/portfolio-engine";
import { buildDailyPlan, buildWeeklyPlan, buildCompanyPlans, computeCompanyReadiness, detectWeakAreas } from "@cp-forge/recommendation-engine";
import { generateRoadmapPlan, toggleNodeProgress } from "@cp-forge/roadmap-engine";
import type { Problem, RoadmapNode, WorkspaceData } from "@cp-forge/schemas";
import { problemBank } from "@cp-forge/sheet-engine";
import { ActivityGrid, BarChart, MindmapCanvas, MindmapTree, RadarChart, StatCard } from "@cp-forge/ui";
import { stableId } from "@cp-forge/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AchievementGrid, CommandPalette, computeAchievements } from "./CommandPalette";
import { CfSearchPanel } from "./CfSearchPanel";

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
  const [sheetSearch, setSheetSearch] = useState("");
  const [sheetPlatform, setSheetPlatform] = useState("all");
  const [mindmapMode, setMindmapMode] = useState<"tree" | "canvas">("canvas");
  const [reviewTab, setReviewTab] = useState<"due" | "overdue" | "upcoming" | "completed">("due");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [stuckOpen, setStuckOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState<Record<string, boolean>>({});
  const [payload, setPayload] = useState<DashboardPayload>(() => buildPayload(createWorkspace({ goal: "amazon", targetCompanies: ["amazon"], preferredLanguage: "cpp" })));
  const fileInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

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
  const achievements = useMemo(() => computeAchievements(workspace, analytics), [workspace, analytics]);
  const stuckDiagnosis = useMemo(() => buildStuckDiagnosis(workspace), [workspace]);

  const filteredSheet = useMemo(() => {
    const query = sheetSearch.trim().toLowerCase();
    return problemBank.filter((problem) => {
      if (sheetPlatform !== "all" && problem.platform !== sheetPlatform) return false;
      if (!query) return true;
      const haystack = [problem.title, problem.platform, problem.difficulty, ...problem.topics, ...problem.patterns, ...problem.companies].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [sheetPlatform, sheetSearch]);

  const importPayload = useCallback((parsed: DashboardPayload) => {
    if (!parsed.workspace?.profile) throw new Error("Invalid dashboard export");
    setPayload(buildPayload(parsed.workspace, parsed));
  }, []);

  const updateWorkspace = useCallback((updater: (workspace: WorkspaceData) => WorkspaceData) => {
    setPayload((current) => buildPayload(updater(current.workspace), current));
  }, []);

  const problemStatusMap = useMemo(() => {
    const map = new Map<string, Problem>();
    workspace.problems.forEach((problem) => map.set(problem.id, problem));
    return map;
  }, [workspace.problems]);

  const importFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      importPayload(JSON.parse(text) as DashboardPayload);
    },
    [importPayload]
  );

  const exportDashboard = useCallback(() => {
    const blob = new Blob([JSON.stringify(buildPayload(workspace), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dashboard-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [workspace]);

  const loadDemo = useCallback(async () => {
    const response = await fetch("/sample-dashboard-data.json");
    if (!response.ok) throw new Error("Demo data missing");
    importPayload((await response.json()) as DashboardPayload);
  }, [importPayload]);

  useEffect(() => {
    const cached = localStorage.getItem("cp-forge-dashboard-cache");
    if (cached) {
      try {
        importPayload(JSON.parse(cached) as DashboardPayload);
      } catch {
        /* ignore */
      }
    }
  }, [importPayload]);

  useEffect(() => {
    localStorage.setItem("cp-forge-dashboard-cache", JSON.stringify(buildPayload(workspace)));
  }, [workspace]);

  const reviewItems = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (reviewTab === "overdue") return workspace.reviews.filter((r) => !r.completed && r.dueDate < today);
    if (reviewTab === "upcoming") return workspace.reviews.filter((r) => !r.completed && r.dueDate > today);
    if (reviewTab === "completed") return workspace.reviews.filter((r) => r.completed);
    return workspace.reviews.filter((r) => !r.completed && r.dueDate <= today);
  }, [reviewTab, workspace.reviews]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === "/" && active === "Sheets") {
        event.preventDefault();
        searchInput.current?.focus();
      }
      if (event.key === "Escape") {
        setSheetSearch("");
        setStuckOpen(false);
      }
      const index = Number(event.key) - 1;
      if (event.altKey && index >= 0 && index < nav.length) {
        event.preventDefault();
        setActive(nav[index]!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const goalLabel = workspace.profile.targetCompanies[0] ?? workspace.profile.goal;
  const weakestPattern = weakAreas[0]?.topic ?? analytics.weakTopics[0] ?? "None logged";
  const masteryPercent = analytics.readinessScore;

  return (
    <main className="app-shell">
      <CommandPalette
        onAction={(action) => {
          if (action === "stuck") setStuckOpen(true);
          if (action === "export") exportDashboard();
          if (action === "demo") void loadDemo().catch(() => alert("Demo data not found."));
          if (action === "import") fileInput.current?.click();
        }}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActive}
        open={paletteOpen}
        pages={nav}
      />
      {stuckOpen ? (
        <div className="palette-backdrop" onClick={() => setStuckOpen(false)} role="presentation">
          <div className="stuck-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h2>Why am I stuck?</h2>
            <p>{stuckDiagnosis.summary}</p>
            <ol>
              {stuckDiagnosis.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ol>
            <button onClick={() => setStuckOpen(false)} type="button">
              Got it — back to training
            </button>
          </div>
        </div>
      ) : null}
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
        <p className="sidebar-hint">Ctrl+K command palette · Alt+1–9 nav</p>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>Local-first dashboard · {workspace.problems.length} tracked problems · {problemBank.length} curated in browser</p>
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
            <button className="btn-secondary" onClick={() => void loadDemo().catch(() => alert("Demo not found."))} type="button">
              Demo
            </button>
            <button className="btn-secondary" onClick={() => setPaletteOpen(true)} type="button">
              ⌘K
            </button>
            <button className="btn-secondary" onClick={() => setStuckOpen(true)} type="button">
              Why stuck?
            </button>
            <button className="btn-primary" onClick={exportDashboard} type="button">
              Export JSON
            </button>
            <button onClick={() => fileInput.current?.click()} type="button">
              Import .cpforge
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
            <Panel title="Achievements">
              <AchievementGrid achievements={achievements} />
            </Panel>
          </>
        )}

        {active === "Today" && (
          <Panel title="Today's CP Forge Plan">
            <TaskCheck done={completedToday.warmup} label="Warmup" onToggle={() => setCompletedToday((s) => ({ ...s, warmup: !s.warmup }))} value={today.warmup.title} />
            {today.main.map((problem, index) => (
              <TaskCheck
                done={completedToday[`main-${index}`]}
                key={problem.id}
                label={`Main ${index + 1}`}
                onToggle={() => setCompletedToday((s) => ({ ...s, [`main-${index}`]: !s[`main-${index}`] }))}
                value={problem.title}
              />
            ))}
            <TaskCheck done={completedToday.review} label="Review" onToggle={() => setCompletedToday((s) => ({ ...s, review: !s.review }))} value={today.reviewProblemId ?? "Schedule first review after solving"} />
            <TaskCheck done={completedToday.upsolve} label="Upsolve" onToggle={() => setCompletedToday((s) => ({ ...s, upsolve: !s.upsolve }))} value={today.upsolveProblemId ?? "No upsolve debt yet"} />
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
              <div className="sheet-toolbar">
                <button className={mindmapMode === "canvas" ? "btn-primary" : ""} onClick={() => setMindmapMode("canvas")} type="button">
                  Canvas
                </button>
                <button className={mindmapMode === "tree" ? "btn-primary" : ""} onClick={() => setMindmapMode("tree")} type="button">
                  Tree
                </button>
              </div>
              {mindmapMode === "canvas" ? (
                <MindmapCanvas node={mindmap} onToggle={(id) => setMindmapOverride(toggleNodeProgress(mindmap, id))} />
              ) : (
                <MindmapTree node={mindmap} onToggle={(id) => setMindmapOverride(toggleNodeProgress(mindmap, id))} />
              )}
            </Panel>
            <Panel title="Weekly Milestones">
              {weekly.map((item) => (
                <Task key={item.day} label={`Day ${item.day}`} value={`${item.focus}: ${item.task}`} />
              ))}
            </Panel>
          </section>
        ) : null}

        {active === "Sheets" && (
          <Panel title={`Problem Sheet · ${filteredSheet.length} of ${problemBank.length}`}>
            <div className="sheet-toolbar">
              <input
                className="search-input"
                onChange={(event) => setSheetSearch(event.target.value)}
                placeholder="Search title, topic, pattern, company… (press /)"
                ref={searchInput}
                type="search"
                value={sheetSearch}
              />
              <select onChange={(event) => setSheetPlatform(event.target.value)} value={sheetPlatform}>
                <option value="all">All platforms</option>
                <option value="leetcode">LeetCode</option>
                <option value="codeforces">Codeforces</option>
                <option value="geeksforgeeks">GFG</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="problem-table">
              {filteredSheet.length ? (
                filteredSheet.slice(0, 120).map((problem) => {
                  const tracked = problemStatusMap.get(problem.id);
                  const status = tracked?.status ?? "unseen";
                  return (
                    <div className="problem-row" key={problem.id}>
                      <a className="problem-link" href={problem.url} rel="noreferrer" target="_blank">
                        <strong>{problem.title}</strong>
                        <span>{problem.platform}</span>
                        <span>{problem.difficulty}</span>
                        <small>{problem.patterns.join(", ") || problem.topics.join(", ")}</small>
                      </a>
                      <div className="problem-meta">
                        <span className={`status-pill status-${status}`}>{status}</span>
                        {tracked?.qualityRating ? <span className="quality-stars">{"★".repeat(tracked.qualityRating)}</span> : null}
                      </div>
                      <div className="problem-actions">
                        <button
                          onClick={() =>
                            updateWorkspace((ws) => ({
                              ...ws,
                              problems: upsertProblem(ws.problems, { ...problem, status: "solved", solvedAt: new Date().toISOString() })
                            }))
                          }
                          type="button"
                        >
                          Solved
                        </button>
                        <button
                          onClick={() => {
                            const note = window.prompt("Note for this problem:", tracked?.notes ?? "");
                            if (note === null) return;
                            updateWorkspace((ws) => ({
                              ...ws,
                              problems: upsertProblem(ws.problems, { ...problem, notes: note, status: tracked?.status ?? "attempted" })
                            }));
                          }}
                          type="button"
                        >
                          Note
                        </button>
                        <button
                          onClick={() =>
                            updateWorkspace((ws) => ({
                              ...ws,
                              reviews: [
                                ...ws.reviews,
                                {
                                  id: stableId("review", problem.id, Date.now()),
                                  problemId: problem.id,
                                  reason: "Scheduled from dashboard sheet",
                                  interval: 7,
                                  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                                  completed: false
                                }
                              ],
                              problems: upsertProblem(ws.problems, { ...problem, status: tracked?.status ?? "review_later" })
                            }))
                          }
                          type="button"
                        >
                          Review
                        </button>
                        <button
                          onClick={() =>
                            updateWorkspace((ws) => ({
                              ...ws,
                              mistakes: [
                                ...ws.mistakes,
                                {
                                  id: stableId("mistake", problem.id, Date.now()),
                                  problemId: problem.id,
                                  title: problem.title,
                                  category: "missed edge case",
                                  topic: problem.topics[0],
                                  pattern: problem.patterns[0],
                                  severity: "medium",
                                  description: "Logged from dashboard",
                                  fix: "Revisit constraints and edge cases",
                                  createdAt: new Date().toISOString()
                                }
                              ]
                            }))
                          }
                          type="button"
                        >
                          Mistake
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="empty-sheet">No problems match your filters.</p>
              )}
            </div>
            <CfSearchPanel />
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
            <Task label="LeetCode" value={workspace.profile.leetcodeHandle ?? "Not linked — cp-forge sync --leetcode handle"} />
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
            <div className="sheet-toolbar">
              {(["due", "overdue", "upcoming", "completed"] as const).map((tab) => (
                <button className={reviewTab === tab ? "btn-primary" : ""} key={tab} onClick={() => setReviewTab(tab)} type="button">
                  {tab}
                </button>
              ))}
            </div>
            {reviewItems.length ? (
              reviewItems.map((item) => (
                <Task key={item.id} label={item.dueDate} value={`${item.problemId} · ${item.reason}`} />
              ))
            ) : (
              <p>No reviews in this bucket. Run `cp-forge review schedule` after solving.</p>
            )}
          </Panel>
        )}

        {active === "Companies" && (
          <section className="two-col">
            <Panel title="Company Readiness">
              {(workspace.profile.targetCompanies.length ? workspace.profile.targetCompanies : ["amazon"]).map((company) => (
                <div className="company-block" key={company}>
                  <h3>{company}</h3>
                  <p className="company-meta">{filterSheetCount(company)} tagged problems in bank</p>
                  {buildCompanyPlans(company).map((plan) => (
                    <div className="company-plan" key={plan.days}>
                      <strong>{plan.title}</strong>
                      <p>Focus: {plan.focus.join(", ")}</p>
                      <ul>
                        {plan.milestones.slice(0, 4).map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                      <p>Must-solve: {plan.mustSolve.slice(0, 5).join(" · ") || `Run cp-forge sheet --company ${company}`}</p>
                    </div>
                  ))}
                </div>
              ))}
            </Panel>
            {(workspace.profile.targetCompanies.length ? workspace.profile.targetCompanies : ["amazon"]).map((company) => (
              <RadarChart key={`radar-${company}`} title={`${company} readiness radar`} data={computeCompanyReadiness(workspace, company)} />
            ))}
          </section>
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
            <Task label="AI assist" value={workspace.profile.aiAssistEnabled ? "Enabled (future)" : "Off — local-first default"} />
            <p className="settings-note">All data stays local in `.cpforge/`. Export with `cp-forge export` or the Export JSON button above.</p>
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

function upsertProblem(problems: Problem[], next: Problem): Problem[] {
  const index = problems.findIndex((problem) => problem.id === next.id);
  if (index >= 0) {
    const copy = [...problems];
    copy[index] = { ...copy[index], ...next };
    return copy;
  }
  return [...problems, next];
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="panel">
    <h2>{title}</h2>
    {children}
  </section>
);

const TaskCheck = ({
  label,
  value,
  done,
  onToggle
}: {
  label: string;
  value: string;
  done?: boolean;
  onToggle: () => void;
}) => (
  <div className={`task-row task-check ${done ? "done" : ""}`}>
    <button aria-label={`Mark ${label} complete`} className="task-check-btn" onClick={onToggle} type="button">
      {done ? "✓" : "○"}
    </button>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const Task = ({ label, value }: { label: string; value: string }) => (
  <div className="task-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);
