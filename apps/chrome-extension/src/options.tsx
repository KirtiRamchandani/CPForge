import React from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

createRoot(document.getElementById("root")!).render(
  <main>
    <h1>CP Forge Settings</h1>
    <label>
      Codeforces handle
      <input placeholder="tourist" />
    </label>
    <label>
      LeetCode handle
      <input placeholder="your_handle" />
    </label>
    <label>
      <input type="checkbox" /> Enable optional LeetCode GraphQL adapter
    </label>
    <button type="button">Export Local Data</button>
    <button type="button">Clear Local Data</button>
  </main>
);
