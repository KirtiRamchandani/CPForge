if (location.hostname.includes("codeforces.com") && /\/contest\/\d+/.test(location.pathname) && !document.getElementById("cp-forge-contest")) {
  const panel = document.createElement("aside");
  panel.id = "cp-forge-contest";
  panel.innerHTML = `
    <header><strong>Contest Cockpit</strong><span id="cp-forge-contest-timer">00:00:00</span></header>
    <p id="cp-forge-contest-title">${document.title}</p>
    <ul id="cp-forge-contest-problems"></ul>
    <section><strong>Timeline</strong><ol id="cp-forge-contest-log"></ol></section>
    <button id="cp-forge-contest-upsolve" type="button">Export upsolve queue</button>
  `;
  document.body.appendChild(panel);

  const problems = Array.from(document.querySelectorAll(".contest-problems a, .problemindexholder a")).slice(0, 12);
  const list = panel.querySelector("#cp-forge-contest-problems") as HTMLUListElement;
  problems.forEach((link) => {
    const li = document.createElement("li");
    const anchor = link as HTMLAnchorElement;
    li.innerHTML = `<a href="${anchor.href}">${anchor.textContent?.trim()}</a> <button data-url="${anchor.href}">Focus</button>`;
    list.appendChild(li);
  });

  const log = panel.querySelector("#cp-forge-contest-log") as HTMLOListElement;
  const appendLog = (text: string) => {
    const item = document.createElement("li");
    item.textContent = `${new Date().toLocaleTimeString()} — ${text}`;
    log.prepend(item);
  };

  list.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "BUTTON") {
      appendLog(`Focused ${target.getAttribute("data-url")}`);
    }
  });

  let seconds = 0;
  setInterval(() => {
    seconds += 1;
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    (panel.querySelector("#cp-forge-contest-timer") as HTMLElement).textContent = `${h}:${m}:${s}`;
  }, 1000);

  panel.querySelector("#cp-forge-contest-upsolve")?.addEventListener("click", async () => {
    const stored = await chrome.storage.local.get("cp-forge-session");
    const sessions = stored["cp-forge-session"] ?? {};
    const upsolve = Object.values(sessions as Record<string, { status?: string }>).filter((s) => s.status === "upsolve");
    appendLog(`Queued ${upsolve.length} upsolve items`);
  });

  appendLog("Contest cockpit ready");
}
