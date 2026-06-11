import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <main>
      <nav>
        <strong>CP Forge Docs</strong>
        <a href="#cli">CLI</a>
        <a href="#dashboard">Dashboard</a>
        <a href="#privacy">Privacy</a>
      </nav>
      <section className="hero">
        <h1>The personal training OS for programmers.</h1>
        <p>Roadmaps, sheets, mistakes, review, upsolve, charts, extension workflows, and local-first exports.</p>
        <code>npx cp-forge launch --goal amazon --days 45</code>
      </section>
      <section id="cli">
        <h2>CLI</h2>
        <p>The CLI initializes the local workspace and creates deterministic training plans.</p>
      </section>
      <section id="dashboard">
        <h2>Dashboard</h2>
        <p>The dashboard visualizes daily practice, weak topics, review load, upsolve debt, and the flagship mindmap.</p>
      </section>
      <section id="privacy">
        <h2>Privacy</h2>
        <p>No telemetry, no hidden backend, no required account, no AI dependency, no external analytics.</p>
      </section>
    </main>
  </React.StrictMode>
);
