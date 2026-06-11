import { parseLeetCodeProblemPage } from "@cp-forge/platform-adapters";

const STORAGE_KEY = "cp-forge-session";
const MISTAKE_KEY = "cp-forge-mistakes";

interface SessionState {
  url: string;
  title: string;
  platform: string;
  status: string;
  notes: string;
  updatedAt: string;
  difficulty?: string;
  topics?: string[];
}

interface DetectedProblem {
  title: string;
  platform: string;
  url: string;
  difficulty: string;
  topics: string[];
}

const detectProblem = (): DetectedProblem | null => {
  const host = location.hostname;
  const path = location.pathname;

  if (host.includes("leetcode.com") && path.includes("/problems/")) {
    const parsed = parseLeetCodeProblemPage(document.documentElement.outerHTML, location.href);
    return { title: parsed.title, platform: "leetcode", url: location.href, difficulty: parsed.difficulty, topics: parsed.topics };
  }
  if (host.includes("codeforces.com") && /\/problem/.test(path)) {
    return {
      title: document.querySelector(".problem-statement .title")?.textContent?.trim() ?? "Codeforces Problem",
      platform: "codeforces",
      url: location.href,
      difficulty: document.querySelector(".tag-box")?.textContent?.trim() ?? "unknown",
      topics: Array.from(document.querySelectorAll(".tag-box a")).map((el) => el.textContent?.trim() ?? "").filter(Boolean)
    };
  }
  if (host.includes("atcoder.jp") && path.includes("/tasks/")) {
    return {
      title: document.querySelector("#task-statement span")?.textContent?.trim() ?? document.title.split(" - ")[0] ?? "AtCoder Task",
      platform: "atcoder",
      url: location.href,
      difficulty: "atcoder",
      topics: []
    };
  }
  if (host.includes("geeksforgeeks.org") && /\/problems\//.test(path)) {
    return {
      title: document.querySelector("h1, .problems_header_content__title")?.textContent?.trim() ?? "GFG Problem",
      platform: "geeksforgeeks",
      url: location.href,
      difficulty: document.querySelector(".difficulty-bar, .badge")?.textContent?.trim() ?? "unknown",
      topics: []
    };
  }
  if (host.includes("cses.fi") && path.includes("/problemset/")) {
    return {
      title: document.querySelector("h1")?.textContent?.trim() ?? "CSES Problem",
      platform: "cses",
      url: location.href,
      difficulty: "cses",
      topics: []
    };
  }
  return null;
};

const problem = detectProblem();

if (problem && !document.getElementById("cp-forge-sidebar")) {
  void mountSidebar(problem);
  enhanceProblemLinks();
}

async function mountSidebar(problem: DetectedProblem) {
  const mistakes = await loadMistakeCount();
  const sidebar = document.createElement("aside");
  sidebar.id = "cp-forge-sidebar";
  sidebar.innerHTML = `
    <header>
      <strong>CP Forge</strong>
      <span>${escapeHtml(problem.platform)}</span>
    </header>
    <h2>${escapeHtml(problem.title)}</h2>
    <p>${escapeHtml(problem.difficulty)} · <span id="cp-forge-timer">00:00</span></p>
    ${mistakes.overflow ? `<p class="cp-forge-warn">⚠ You logged ${mistakes.overflow} overflow mistakes before. Check integer types.</p>` : ""}
    <button data-status="solving">Start Solving</button>
    <button data-status="solved">Mark Solved</button>
    <button data-status="upsolve">Send To Upsolve</button>
    <label>Notes<textarea placeholder="Approach, bug, edge case, complexity"></textarea></label>
    <section>
      <strong>Pre-submit checklist</strong>
      <ul>
        <li>Integer overflow / long long</li>
        <li>Multiple test cases</li>
        <li>Boundary cases</li>
        <li>Complexity fits limits</li>
        <li>Clear arrays between cases</li>
      </ul>
    </section>
    <footer><small id="cp-forge-sync-status">Saved locally</small></footer>
    <button id="cp-forge-export" type="button">Export to .cpforge</button>
  `;
  document.body.appendChild(sidebar);

  const textarea = sidebar.querySelector("textarea") as HTMLTextAreaElement;
  const statusLabel = sidebar.querySelector("#cp-forge-sync-status") as HTMLElement;

  const loadState = async (): Promise<SessionState> => {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const sessions = (stored[STORAGE_KEY] ?? {}) as Record<string, SessionState>;
    return (
      sessions[problem.url] ?? {
        url: problem.url,
        title: problem.title,
        platform: problem.platform,
        status: "unseen",
        notes: "",
        updatedAt: new Date().toISOString(),
        difficulty: problem.difficulty,
        topics: problem.topics
      }
    );
  };

  const saveState = async (patch: Partial<SessionState>) => {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const sessions = (stored[STORAGE_KEY] ?? {}) as Record<string, SessionState>;
    const next = {
      ...(sessions[problem.url] ?? {
        url: problem.url,
        title: problem.title,
        platform: problem.platform,
        status: "unseen",
        notes: "",
        updatedAt: new Date().toISOString()
      }),
      ...patch,
      updatedAt: new Date().toISOString()
    };
    sessions[problem.url] = next;
    await chrome.storage.local.set({ [STORAGE_KEY]: sessions });
    statusLabel.textContent = `Saved ${new Date(next.updatedAt).toLocaleTimeString()}`;
  };

  void loadState().then((state) => {
    textarea.value = state.notes;
    sidebar.querySelectorAll("button[data-status]").forEach((button) => {
      if (button.getAttribute("data-status") === state.status) button.classList.add("active");
    });
  });

  sidebar.querySelectorAll("button[data-status]").forEach((button) => {
    button.addEventListener("click", () => {
      const status = button.getAttribute("data-status") ?? "solving";
      sidebar.querySelectorAll("button[data-status]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      void saveState({ status });
    });
  });

  textarea.addEventListener(
    "input",
    debounce(() => {
      void saveState({ notes: textarea.value });
    }, 400)
  );

  sidebar.querySelector("#cp-forge-export")?.addEventListener("click", async () => {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const sessions = (stored[STORAGE_KEY] ?? {}) as Record<string, SessionState>;
    downloadJson("cpforge-extension-sync.json", { exportedAt: new Date().toISOString(), sessions });
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
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const sessions = (stored[STORAGE_KEY] ?? {}) as Record<string, SessionState>;
  document.querySelectorAll("a[href*='/problem'], a[href*='/problems/'], a[href*='/tasks/']").forEach((anchor) => {
    const link = anchor as HTMLAnchorElement;
    const session = sessions[link.href];
    if (!session || session.status === "unseen") return;
    if (link.querySelector(".cp-forge-badge")) return;
    const badge = document.createElement("span");
    badge.className = "cp-forge-badge";
    badge.textContent = ` [${session.status}]`;
    link.appendChild(badge);
  });
}

async function loadMistakeCount() {
  const stored = await chrome.storage.local.get(MISTAKE_KEY);
  const list = (stored[MISTAKE_KEY] ?? []) as Array<{ category: string }>;
  return { overflow: list.filter((m) => m.category === "overflow").length };
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
