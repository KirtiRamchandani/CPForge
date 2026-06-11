import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const sections = [
  { id: "cli", title: "CLI", body: "Initialize with cp-forge launch, then today, doctor, review, upsolve, mistakes, contest, and dashboard." },
  { id: "dashboard", title: "Dashboard", body: "Import .cpforge/exports/dashboard-data.json for skill trees, charts, contests, portfolio, and progress." },
  { id: "extensions", title: "Extensions", body: "Chrome sidebar on LeetCode/Codeforces. VS Code commands write to .cpforge/notes and problems.json." },
  { id: "packs", title: "Community packs", body: "blind-75, neetcode-150, cf-specialist, amazon-45 — install with cp-forge pack add <name>." },
  { id: "privacy", title: "Privacy", body: "No telemetry, no hidden backend, no required account, no AI dependency." }
];

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <main className="docs-shell">
      <nav>
        <strong>CP Forge Docs</strong>
        {sections.map((section) => (
          <a href={`#${section.id}`} key={section.id}>
            {section.title}
          </a>
        ))}
      </nav>
      <section className="hero">
        <h1>The personal training OS for programmers.</h1>
        <p>Roadmaps, sheets, mistakes, review, upsolve, contests, charts, extensions, and local-first exports.</p>
        <code>npx cp-forge launch --goal amazon --days 45</code>
      </section>
      {sections.map((section) => (
        <section id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </main>
  </React.StrictMode>
);
