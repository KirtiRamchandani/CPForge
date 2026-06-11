import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";

interface Settings {
  cfHandle: string;
  leetcodeHandle: string;
  enableLeetcodeGraphql: boolean;
  dailyPlan: string;
}

const DEFAULTS: Settings = {
  cfHandle: "",
  leetcodeHandle: "",
  enableLeetcodeGraphql: false,
  dailyPlan: "1 warmup · 2 main · 1 review · 1 upsolve"
};

createRoot(document.getElementById("root")!).render(<Options />);

function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    void chrome.storage.local.get("cp-forge-settings").then((stored) => {
      setSettings({ ...DEFAULTS, ...(stored["cp-forge-settings"] ?? {}) });
    });
  }, []);

  const save = async () => {
    await chrome.storage.local.set({ "cp-forge-settings": settings });
    setSaved("Saved locally.");
    setTimeout(() => setSaved(""), 2000);
  };

  const clear = async () => {
    await chrome.storage.local.remove(["cp-forge-settings", "cp-forge-session"]);
    setSettings(DEFAULTS);
    setSaved("Cleared local extension data.");
  };

  return (
    <main className="popup-shell options-shell">
      <h1>CP Forge Settings</h1>
      <label>
        Codeforces handle
        <input onChange={(e) => setSettings({ ...settings, cfHandle: e.target.value })} value={settings.cfHandle} />
      </label>
      <label>
        LeetCode handle
        <input onChange={(e) => setSettings({ ...settings, leetcodeHandle: e.target.value })} value={settings.leetcodeHandle} />
      </label>
      <label>
        Daily plan hint
        <input onChange={(e) => setSettings({ ...settings, dailyPlan: e.target.value })} value={settings.dailyPlan} />
      </label>
      <label className="checkbox-row">
        <input
          checked={settings.enableLeetcodeGraphql}
          onChange={(e) => setSettings({ ...settings, enableLeetcodeGraphql: e.target.checked })}
          type="checkbox"
        />
        Enable optional LeetCode GraphQL adapter (experimental)
      </label>
      <div className="popup-actions">
        <button onClick={() => void save()} type="button">
          Save
        </button>
        <button onClick={() => void clear()} type="button">
          Clear local data
        </button>
      </div>
      {saved ? <p className="saved-msg">{saved}</p> : null}
      <p className="privacy-note">All data stays in chrome.storage.local. No telemetry.</p>
    </main>
  );
}
