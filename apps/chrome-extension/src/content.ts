import { parseLeetCodeProblemPage } from "@cp-forge/platform-adapters";

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
          topics: []
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
  `;
  document.body.appendChild(sidebar);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
