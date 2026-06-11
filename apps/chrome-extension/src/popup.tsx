import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

interface Settings {
  cfHandle?: string;
  leetcodeHandle?: string;
  dailyPlan?: string;
}

createRoot(document.getElementById("root")!).render(<Popup />);

function Popup() {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    void chrome.storage.local.get(["cp-forge-settings", "cp-forge-session"]).then((stored) => {
      setSettings({
        cfHandle: stored["cp-forge-settings"]?.cfHandle,
        leetcodeHandle: stored["cp-forge-settings"]?.leetcodeHandle,
        dailyPlan: stored["cp-forge-settings"]?.dailyPlan ?? "1 warmup · 2 main · 1 review · 1 upsolve"
      });
    });
  }, []);

  return (
    <main className="popup-shell">
      <header>
        <strong>CP Forge</strong>
        <span>Companion</span>
      </header>
      <section>
        <h2>Today</h2>
        <p>{settings.dailyPlan}</p>
      </section>
      <section>
        <h2>Handles</h2>
        <p>CF: {settings.cfHandle ?? "not set"}</p>
        <p>LC: {settings.leetcodeHandle ?? "not set"}</p>
      </section>
      <div className="popup-actions">
        <button onClick={() => chrome.runtime.openOptionsPage()} type="button">
          Settings
        </button>
        <button
          onClick={() => {
            void chrome.storage.local.get("cp-forge-session").then((stored) => {
              const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), sessions: stored["cp-forge-session"] ?? {} }, null, 2)], {
                type: "application/json"
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "cpforge-extension-sync.json";
              anchor.click();
              URL.revokeObjectURL(url);
            });
          }}
          type="button"
        >
          Export sync
        </button>
      </div>
    </main>
  );
}
