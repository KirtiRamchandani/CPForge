import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const features = [
  { title: "11k+ problem bank", body: "Full Codeforces problemset cached locally. Curated Blind 75, NeetCode 150, Amazon 45, CF specialist packs." },
  { title: "Roadmaps & skill trees", body: "Personalized DSA/CP roadmaps with interactive mindmaps, weekly milestones, and progress toggles." },
  { title: "Mistake bank", body: "Log bugs, edge cases, and complexity slips. Export to Anki flashcards and pattern-focused reviews." },
  { title: "Review & upsolve", body: "Spaced repetition scheduler, ICS calendar export, and contest upsolve queues that actually stick." },
  { title: "Contest engine", body: "Virtual contests by rating, upcoming CF alerts, and readiness scoring before you register." },
  { title: "Local-first", body: "Everything in .cpforge/. No account, no telemetry, no cloud lock-in. Export anytime." }
];

const commands = [
  ["cp-forge launch --goal amazon --days 45", "One-shot setup: roadmap, sheet, reviews, dashboard export"],
  ["cp-forge sync --all", "Pull Codeforces + LeetCode public submissions"],
  ["cp-forge today", "Daily warmup, main set, review, upsolve, reflection"],
  ["cp-forge doctor", "Stuck diagnosis from mistakes and weak patterns"],
  ["cp-forge contest --rating 1400", "Build a virtual contest block"],
  ["cp-forge pack add blind-75", "Install community problem packs"]
];

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <main className="docs-shell">
      <header className="docs-nav">
        <div className="logo">
          <span>CPF</span>
          <strong>CP Forge</strong>
        </div>
        <nav>
          <a href="#features">Features</a>
          <a href="#cli">CLI</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#extensions">Extensions</a>
          <a href="https://github.com/KirtiRamchandani/CPForge">GitHub</a>
        </nav>
      </header>

      <section className="hero">
        <p className="eyebrow">Open source · Local-first · Built for DSA, CP, and interviews</p>
        <h1>The training OS that turns practice into measurable growth.</h1>
        <p className="lead">
          Roadmaps, sheets, mistakes, spaced review, upsolve, contests, analytics, browser + editor extensions — all in one workspace you own.
        </p>
        <div className="hero-actions">
          <code>npx cp-forge launch --goal cp --cf your_handle</code>
          <a className="cta" href="https://github.com/KirtiRamchandani/CPForge#quick-start">
            Quick start →
          </a>
        </div>
        <div className="hero-stats">
          <div><strong>11,237</strong><span>CF problems cached</span></div>
          <div><strong>17</strong><span>dashboard views</span></div>
          <div><strong>0</strong><span>required accounts</span></div>
        </div>
      </section>

      <section className="feature-grid" id="features">
        {features.map((feature) => (
          <article key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="cli-section" id="cli">
        <h2>CLI that coaches, not just commands</h2>
        <p>Beautiful launch reports, doctor diagnostics, and exports that feed the dashboard and extensions.</p>
        <div className="terminal">
          {commands.map(([cmd, desc]) => (
            <div className="terminal-row" key={cmd}>
              <span className="prompt">$</span>
              <code>{cmd}</code>
              <small>{desc}</small>
            </div>
          ))}
        </div>
      </section>

      <section id="dashboard">
        <h2>Dashboard</h2>
        <p>
          Run <code>cp-forge dashboard</code> then import <code>.cpforge/exports/dashboard-data.json</code> — or use the built-in demo. Skill trees, charts, contests, portfolio, and company readiness in one view.
        </p>
      </section>

      <section id="extensions">
        <h2>Extensions</h2>
        <p>
          Chrome sidebar on LeetCode and Codeforces with timer, checklist, and local export. VS Code commands for notes, mistakes, sample runs, and session sync into <code>.cpforge/</code>.
        </p>
      </section>

      <footer>
        <p>MIT · No telemetry · Your data stays on your machine.</p>
      </footer>
    </main>
  </React.StrictMode>
);
