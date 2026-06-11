import { parseLeetCodeProblemPage } from "@cp-forge/platform-adapters";

const STORAGE_KEY = "cp-forge-session";

interface SessionState {
  url: string;
  title: string;
  platform: string;
  status: string;
  notes: string;
  updatedAt: string;
}

const isProblemPage =
  location.hostname.includes("codeforces.com") || (location.hostname.includes("leetcode.com") && location.pathname.includes("/problems/"));

if (isProblemPage && !document.getElementById("cp-forge-sidebar")) {
  const problem =
    location.hostname.includes("leetcode.com")
      ? parseLeetCodeProblemPage(document.documentElement.outerHTML, location.href)
      : {
          title: document.querySelector(".problem-statement .title")?.textContent?.trim() ?? "Codeforces Problem",
          platform: "codeforces",
          url: location.href,
          difficulty: "unknown",
          topics: [] as string[]
        };

  const sidebar = document.createElement("aside");
  sidebar.id = "cp-forge-sidebar";
  sidebar.innerHTML = `
    <header>
      <strong>CP Forge</strong>
      <span>${problem.platform}</span>
    </header>
    <h2>${escapeHtml(problem.title)}</h2>
    <p>${escapeHtml(problem.difficulty)} · Local-first tracking</p>
    <button data-status="solving">Start Solving</button>
    <button data-status="solved">Mark Solved</button>
    <button data-status="upsolve">Send To Upsolve</button>
    <label>Notes<textarea placeholder="Approach, bug, edge case, complexity"></textarea></label>
    <section>
      <strong>Checklist</strong>
      <ul>
        <li>Integer overflow checked</li>
        <li>Multiple test cases handled</li>
        <li>Boundary cases tested</li>
        <li>Complexity fits constraints</li>
      </ul>
    </section>
    <footer><small id="cp-forge-sync-status">Saved locally</small></footer>
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
        updatedAt: new Date().toISOString()
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
