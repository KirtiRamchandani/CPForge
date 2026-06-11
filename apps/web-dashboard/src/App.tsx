import { analyzeWorkspace } from "@cp-forge/analytics-engine";
import { buildLaunchReport, createWorkspace } from "@cp-forge/core";
import { buildDailyPlan, buildWeeklyPlan, detectWeakAreas } from "@cp-forge/recommendation-engine";
import { generateRoadmapPlan } from "@cp-forge/roadmap-engine";
import { problemBank } from "@cp-forge/sheet-engine";
import { BarChart, MindmapTree, StatCard } from "@cp-forge/ui";
import { useMemo, useState } from "react";

const nav = ["Home", "Today", "Roadmaps", "Mindmap", "Sheets", "Charts", "Weaknesses", "Mistakes", "Upsolve", "Reviews", "Companies", "Portfolio", "Settings"];

export const App = () => {
  const [active, setActive] = useState("Home");
  const workspace = useMemo(() => createWorkspace({ goal: "amazon", targetCompanies: ["amazon"], preferredLanguage: "cpp" }), []);
  const analytics = analyzeWorkspace(workspace);
  const weakAreas = detectWeakAreas(workspace);
  const today = buildDailyPlan(workspace, workspace.profile);
  const weekly = buildWeeklyPlan(workspace, workspace.profile);
  const roadmap = generateRoadmapPlan({ goal: "amazon", days: 45, weakTopics: weakAreas.map((area) => area.topic) });
  const report = buildLaunchReport(workspace, { days: 45, profile: workspace.profile, offline: true });

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
            <p>Local-first dashboard</p>
            <h1>{active}</h1>
          </div>
          <button type="button">Import .cpforge</button>
        </header>

        {active === "Home" && (
          <>
            <section className="hero-band">
              <div>
                <p>Goal: Amazon SDE Interview</p>
                <h2>The fastest way to turn practice into measurable growth.</h2>
              </div>
              <div className="next-action">
                <span>Next action</span>
                <strong>{report.next.action}</strong>
                <p>{report.next.reason}</p>
              </div>
            </section>
            <section className="stat-grid">
              <StatCard label="DSA Mastery" value="62%" detail="Roadmap progress with reviews" />
              <StatCard label="CP Growth" value="Specialist Path" detail="Rating-aware ladder" />
              <StatCard label="Amazon Readiness" value={`${analytics.readinessScore}%`} detail="Company pattern coverage" />
              <StatCard label="Review Load" value={`${analytics.reviewDueCount} due`} detail="Spaced repetition" />
              <StatCard label="Weakest Pattern" value="Sliding Window" detail="High-frequency and low coverage" />
              <StatCard label="Mistake Focus" value="Off-by-one" detail="Track fixes, not shame" />
            </section>
            <section className="two-col">
              <BarChart title="Topic Distribution" data={analytics.topicDistribution} />
              <Panel title="Coach Mode">
                {weakAreas.map((area) => (
                  <p key={area.topic}>{area.reason}</p>
                ))}
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

        {active === "Mindmap" || active === "Roadmaps" ? (
          <section className="mindmap-layout">
            <Panel title="Skill Tree">
              <MindmapTree node={roadmap.mindmap} />
            </Panel>
            <Panel title="Weekly Milestones">
              {weekly.map((item) => (
                <Task key={item.day} label={`Day ${item.day}`} value={`${item.focus}: ${item.task}`} />
              ))}
            </Panel>
          </section>
        ) : null}

        {active === "Sheets" && (
          <Panel title="Personalized Sheet">
            <div className="problem-table">
              {problemBank.slice(0, 10).map((problem) => (
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
          </section>
        )}

        {active === "Weaknesses" && (
          <Panel title="Why Am I Stuck?">
            {weakAreas.map((area) => (
              <Task key={area.topic} label={area.topic} value={area.reason} />
            ))}
          </Panel>
        )}

        {!["Home", "Today", "Mindmap", "Roadmaps", "Sheets", "Charts", "Weaknesses"].includes(active) && (
          <Panel title={`${active} Module`}>
            <p>This surface is wired into the shared CP Forge data model and ready for deeper workflows.</p>
            <p>Use the CLI exports to populate it with your local `.cpforge` data.</p>
          </Panel>
        )}
      </section>
    </main>
  );
};

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
