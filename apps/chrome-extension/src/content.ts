import { detectProblemFromPage } from "@cp-forge/platform-adapters";
import { analyzePageTextareas } from "./lib/checklist";
import { loadMistakeStats, loadSession, saveSession, type SessionState } from "./lib/storage";

const problem = detectProblemFromPage(document.documentElement.outerHTML, location.href);

if (problem && !document.getElementById("cp-forge-sidebar")) {
  void mountSidebar(problem);
  void enhanceProblemLinks();
}

async function mountSidebar(problem: NonNullable<ReturnType<typeof detectProblemFromPage>>) {
  const mistakes = await loadMistakeStats();
  const overflow = mistakes.byCategory.overflow ?? 0;
  const sidebar = document.createElement("aside");
  sidebar.id = "cp-forge-sidebar";
  sidebar.innerHTML = `
    <header><strong>CP Forge</strong><span>${escapeHtml(problem.platform)}</span></header>
    <h2>${escapeHtml(problem.title)}</h2>
    <p>${escapeHtml(problem.difficulty)} · <span id="cp-forge-timer">00:00</span></p>
    ${overflow ? `<p class="cp-forge-warn">⚠ ${overflow} overflow mistakes logged before — check types.</p>` : ""}
    <button data-status="solving">Start Solving</button>
    <button data-status="solved">Mark Solved</button>
    <button data-status="attempted">Mark Attempted</button>
    <button data-status="upsolve">Send To Upsolve</button>
    <button data-status="review_later">Review Later</button>
    <button id="cp-forge-check-code" type="button">Run Checklist</button>
    <ul id="cp-forge-warnings"></ul>
    <label>Notes<textarea placeholder="Approach, bug, edge case, complexity"></textarea></label>
    <footer><small id="cp-forge-sync-status">Saved locally + IndexedDB</small></footer>
    <button id="cp-forge-export" type="button">Export to .cpforge</button>
  `;
  document.body.appendChild(sidebar);

  const textarea = sidebar.querySelector("textarea") as HTMLTextAreaElement;
  const statusLabel = sidebar.querySelector("#cp-forge-sync-status") as HTMLElement;
  const base: SessionState = {
    url: problem.url,
    title: problem.title,
    platform: problem.platform,
    status: "unseen",
    notes: "",
    updatedAt: new Date().toISOString(),
    difficulty: problem.difficulty,
    topics: problem.topics
  };

  const state = await loadSession(problem.url, base);
  textarea.value = state.notes;
  sidebar.querySelectorAll("button[data-status]").forEach((button) => {
    if (button.getAttribute("data-status") === state.status) button.classList.add("active");
  });

  sidebar.querySelectorAll("button[data-status]").forEach((button) => {
    button.addEventListener("click", () => {
      const status = button.getAttribute("data-status") ?? "solving";
      sidebar.querySelectorAll("button[data-status]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      void saveSession(problem.url, { status }, { ...base, ...state }).then((next) => {
        statusLabel.textContent = `Saved ${new Date(next.updatedAt).toLocaleTimeString()}`;
        void enhanceProblemLinks();
      });
    });
  });

  textarea.addEventListener(
    "input",
    debounce(() => {
      void saveSession(problem.url, { notes: textarea.value }, { ...base, ...state });
    }, 400)
  );

  sidebar.querySelector("#cp-forge-check-code")?.addEventListener("click", () => {
    const warnings = analyzePageTextareas();
    const list = sidebar.querySelector("#cp-forge-warnings") as HTMLUListElement;
    list.innerHTML = warnings.length
      ? warnings.map((w) => `<li><strong>${escapeHtml(w.title)}</strong> (${w.confidence}): ${escapeHtml(w.fix)}</li>`).join("")
      : "<li>No issues detected in visible editor — still verify manually.</li>";
  });

  sidebar.querySelector("#cp-forge-export")?.addEventListener("click", async () => {
    const stored = await chrome.storage.local.get("cp-forge-session");
    downloadJson("cpforge-extension-sync.json", { exportedAt: new Date().toISOString(), sessions: stored["cp-forge-session"] ?? {} });
    statusLabel.textContent = "Exported extension sync JSON";
  });

  const timerEl = sidebar.querySelector("#cp-forge-timer") as HTMLElement;
  let seconds = 0;
  window.setInterval(() => {
    seconds += 1;
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

async function enhanceProblemLinks() {
  const { loadAllSessions } = await import("./lib/storage");
  const sessions = await loadAllSessions();
  document.querySelectorAll("a[href*='problem'], a[href*='/problems/'], a[href*='/tasks/']").forEach((anchor) => {
    const link = anchor as HTMLAnchorElement;
    const session = sessions[link.href];
    if (!session || session.status === "unseen") return;
    link.querySelectorAll(".cp-forge-badge").forEach((b) => b.remove());
    const badges = [session.status];
    if (session.notes) badges.push("notes");
    const badge = document.createElement("span");
    badge.className = "cp-forge-badge";
    badge.textContent = ` [${badges.join(", ")}]`;
    link.appendChild(badge);
  });
}

function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function debounce(fn: () => void, wait: number) {
  let timer: number | undefined;
  return () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(fn, wait);
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
