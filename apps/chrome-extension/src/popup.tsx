import React from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

createRoot(document.getElementById("root")!).render(
  <main>
    <h1>CP Forge</h1>
    <section>
      <strong>Today</strong>
      <p>1 warmup, 2 main problems, 1 review, 1 upsolve, 1 reflection.</p>
    </section>
    <section>
      <strong>Weak topics</strong>
      <p>Sliding Window · DP · Trees</p>
    </section>
    <button type="button">Open Dashboard</button>
    <button type="button">Export Data</button>
  </main>
);
