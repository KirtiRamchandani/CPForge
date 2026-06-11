#!/usr/bin/env node
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { analyzeWorkspace, buildStuckDiagnosis } from "@cp-forge/analytics-engine";
import { buildVirtualContest, contestReadinessMessage, parseCodeforcesContests, upcomingContestAlerts } from "@cp-forge/contest-engine";
import { buildLaunchReport, createWorkspace } from "@cp-forge/core";
import {
  chartToSvg,
  mindmapToHtml,
  mindmapToMarkdown,
  mistakesToAnkiCsv,
  mistakesToFlashcardsMarkdown,
  problemsToCsv,
  problemsToMarkdown,
  reviewsToIcs,
  workspaceToJson
} from "@cp-forge/export-engine";
import { createMistake, mistakeStats } from "@cp-forge/mistake-engine";
import {
  CodeforcesApiClient,
  LeetCodeGraphQLClient,
  leetcodeSubmissionsToProblems,
  parseCustomCsv
} from "@cp-forge/platform-adapters";
import { printInfo, printLaunchReport, printList, printSuccess } from "./terminal.js";
import { portfolioHtml, portfolioMarkdown, profileCardSvg } from "@cp-forge/portfolio-engine";
import { buildDailyPlan, buildWeeklyPlan, detectWeakAreas, recommendNext } from "@cp-forge/recommendation-engine";
import { completeReview, dueReviews, scheduleReviews } from "@cp-forge/review-scheduler";
import { generateRoadmapPlan } from "@cp-forge/roadmap-engine";
import type { MistakeCategory, Problem, Profile, WorkspaceData } from "@cp-forge/schemas";
import { generateCompanySheet, filterSheet, problemBank } from "@cp-forge/sheet-engine";
import { extendedProblemBank } from "@cp-forge/sheet-engine/extended";
import { deleteWorkspace, exportWorkspace, importWorkspace, initWorkspace, loadWorkspace, saveWorkspace, workspacePaths, writeJson } from "@cp-forge/storage";
import { buildUpsolveQueue, prioritizeUpsolve } from "@cp-forge/upsolve-engine";

const program = new Command();

program
  .name("cp-forge")
  .description("The local-first training OS for DSA, Competitive Programming, and coding interviews.")
  .version("0.1.0");

program
  .command("init")
  .description("Create a local .cpforge workspace.")
  .option("--cf <handle>", "Codeforces handle")
  .option("--leetcode <handle>", "LeetCode handle")
  .option("--language <language>", "preferred language", "cpp")
  .option("--goal <goal>", "training goal", "cp")
  .option("--days <days>", "interview timeline", parseNumber, 45)
  .action(async (options) => {
    const profile = profileFromOptions(options);
    const workspace = createWorkspace(profile);
    await initWorkspace(process.cwd(), profile);
    await saveWorkspace(workspace);
    printSuccess("Initialized CP Forge workspace.");
    printWorkspaceLocation();
  });

program
  .command("launch")
  .description("Initialize, sync optional public data, generate plans, exports, and next action.")
  .option("--cf <handle>", "Codeforces handle")
  .option("--leetcode <handle>", "LeetCode handle")
  .option("--goal <goal>", "goal such as cp, amazon, dsa", "cp")
  .option("--days <days>", "timeline in days", parseNumber, 45)
  .option("--language <language>", "preferred language", "cpp")
  .option("--offline", "skip all network calls")
  .action(async (options) => {
    let workspace = await ensureWorkspace(profileFromOptions(options));
    workspace.profile = { ...workspace.profile, ...profileFromOptions(options) };

    if (!options.offline) {
      if (options.cf) workspace = await tryCodeforcesSync(workspace, options.cf);
      if (options.leetcode) workspace = await tryLeetCodeSync(workspace, options.leetcode);
    }

    workspace.reviews = scheduleReviews(workspace.problems);
    workspace.upsolve = buildUpsolveQueue(workspace.problems, detectWeakAreas(workspace).map((area) => area.topic));
    const report = buildLaunchReport(workspace, { days: options.days, profile: workspace.profile, offline: options.offline });
    workspace.mindmaps = [report.roadmap.mindmap];
    await saveWorkspace(workspace);
    await writeLaunchExports(workspace, report);
    printLaunchReport(report);
  });

program
  .command("sync")
  .description("Sync optional public platform data.")
  .option("--cf <handle>", "Codeforces handle")
  .option("--leetcode <handle>", "LeetCode handle")
  .option("--all", "sync all configured handles")
  .option("--offline", "verify local cache/workspace only")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    if (options.offline) {
      printSuccess("Offline sync complete. Local workspace is readable.");
      return;
    }
    let next = workspace;
    const cf = options.cf ?? (options.all ? workspace.profile.codeforcesHandle : undefined);
    const leetcode = options.leetcode ?? (options.all ? workspace.profile.leetcodeHandle : undefined);
    if (!cf && !leetcode) {
      printInfo("No handles provided. Use --cf, --leetcode, or --all with configured profile handles.");
      return;
    }
    if (cf) {
      next = await tryCodeforcesSync(next, cf);
      printSuccess(`Synced Codeforces data for ${cf}.`);
    }
    if (leetcode) {
      next = await tryLeetCodeSync(next, leetcode);
      printSuccess(`Synced LeetCode data for ${leetcode}.`);
    }
    await saveWorkspace(next);
  });

program
  .command("roadmap")
  .description("Generate a personalized roadmap.")
  .option("--goal <goal>", "dsa, cp, interview, placement, icpc", "dsa")
  .option("--level <level>", "current level")
  .option("--company <company>", "target company")
  .option("--days <days>", "timeline", parseNumber, 45)
  .option("--target-rating <rating>", "target CP rating", parseNumber)
  .option("--format <format>", "markdown, json, notion, sheets", "markdown")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const plan = generateRoadmapPlan({
      goal: options.company ?? options.goal,
      days: options.days,
      level: options.level,
      company: options.company,
      targetRating: options.targetRating,
      weakTopics: detectWeakAreas(workspace).map((area) => area.topic)
    });
    await outputRoadmap(plan, options.format);
  });

program
  .command("sheet")
  .description("Generate a practice sheet.")
  .option("--topic <topic>", "topic filter")
  .option("--pattern <pattern>", "pattern filter")
  .option("--company <company>", "company filter")
  .option("--level <level>", "level filter")
  .option("--cp-level <level>", "Codeforces level filter")
  .option("--weak-only", "only weak topics")
  .option("--revision", "revision sheet")
  .option("--upsolve", "upsolve sheet")
  .option("--format <format>", "csv, markdown, json, notion, obsidian, sheets", "markdown")
  .option("--limit <limit>", "max problems to export", parseNumber, 200)
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const weakTopics = options.weakOnly ? detectWeakAreas(workspace).map((area) => area.topic) : undefined;
    const sheet = options.company
      ? filterSheet(bank(), { company: options.company.toLowerCase() }).slice(0, options.limit ?? 200)
      : filterSheet(bank(), {
          topic: options.topic,
          pattern: options.pattern,
          level: options.level,
          cpLevel: options.cpLevel,
          weakTopics,
          revisionOnly: options.revision,
          upsolveOnly: options.upsolve
        }).slice(0, options.limit ?? 200);
    await outputSheet(sheet, options.format, "sheet");
  });

program
  .command("doctor")
  .description("Give a rule-based training diagnosis.")
  .action(async () => {
    const workspace = await ensureWorkspace();
    const analytics = analyzeWorkspace(workspace);
    const weakAreas = detectWeakAreas(workspace);
    const stats = mistakeStats(workspace.mistakes);
    const stuck = buildStuckDiagnosis(workspace);
    const attempted = workspace.problems.filter((p) => p.attempts > 0 && p.status !== "solved");
    console.log("\nCP Forge Doctor\n");
    console.log("Diagnosis:");
    stuck.reasons.forEach((reason, index) => console.log(`${index + 1}. ${reason}`));
    if (analytics.upsolveCount > 0) console.log(`${stuck.reasons.length + 1}. ${analytics.upsolveCount} problems waiting in upsolve queue.`);
    if (attempted.length > 5) console.log(`${stuck.reasons.length + 2}. ${attempted.length} attempted-but-unsolved problems are blocking rating growth.`);
    console.log(`\nSnapshot: ${analytics.solvedCount} solved · ${analytics.reviewDueCount} reviews due · readiness ${analytics.readinessScore}%`);
    if (stats.total > 0) {
      const top = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0];
      if (top) console.log(`Top mistake category: ${top[0]} (${top[1]})`);
    }
    console.log("\nPrescription:");
    console.log("- Stop random solving for 14 days.");
    console.log("- Solve 20 targeted problems from:", weakAreas.slice(0, 3).map((a) => a.topic).join(", ") || "your weakest topics");
    console.log("- Upsolve", Math.min(analytics.upsolveCount || 3, 10), "failed problems this week.");
    console.log("- Review solved problems on 1, 3, 7, 14, and 30 day intervals.");
    console.log("- Run 2 virtual contests: cp-forge contest --rating", workspace.profile.targetCpRating ?? 1200);
    console.log("- Log one mistake after every wrong answer: cp-forge mistakes add");
  });

program
  .command("next")
  .description("Recommend the next useful problem or action.")
  .option("--time <time>", "available time")
  .option("--goal <goal>", "goal override")
  .option("--weak-only", "force weak topic recommendation")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const profile = { ...workspace.profile, goal: options.goal ?? workspace.profile.goal };
    const rec = recommendNext(workspace, profile);
    console.log(`\nProblem/action: ${rec.title}`);
    console.log(`Priority: ${rec.priority}`);
    console.log(`Why this: ${rec.reason}`);
    console.log(`Estimated time: ${options.time ?? rec.estimatedTime}`);
    console.log(`Follow-up review: schedule after completion`);
  });

program
  .command("review [scope] [id]")
  .description("Show or complete spaced repetition reviews.")
  .action(async (scope = "today", id?: string) => {
    const workspace = await ensureWorkspace();
    if (scope === "complete" && id) {
      workspace.reviews = completeReview(workspace.reviews, id);
      await saveWorkspace(workspace);
      printSuccess(`Completed review ${id}.`);
      return;
    }
    const items = scope === "upcoming" ? workspace.reviews.filter((review) => !review.completed) : dueReviews(workspace.reviews);
    console.log(`\nReviews (${scope})`);
    printList(items.map((item) => `${item.problemId} due ${item.dueDate} - ${item.reason}`));
  });

program
  .command("upsolve [action] [problem]")
  .description("Manage the upsolve queue.")
  .action(async (action = "list", problem?: string) => {
    const workspace = await ensureWorkspace();
    if (action === "priority" || action === "list") {
      printList(prioritizeUpsolve(workspace.upsolve).map((item) => `${item.priority}: ${item.problemId} - ${item.reason}`));
      return;
    }
    if (action === "add" && problem) {
      workspace.upsolve.push({
        id: `upsolve-${problem}`,
        problemId: problem,
        reason: "Manually added for upsolve.",
        priority: "high",
        addedAt: new Date().toISOString().slice(0, 10),
        completed: false
      });
      await saveWorkspace(workspace);
      printSuccess(`Added ${problem} to upsolve queue.`);
      return;
    }
    if (action === "done" && problem) {
      workspace.upsolve = workspace.upsolve.map((item) =>
        item.problemId === problem ? { ...item, completed: true, completedAt: new Date().toISOString().slice(0, 10) } : item
      );
      await saveWorkspace(workspace);
      printSuccess(`Marked ${problem} upsolved.`);
    }
  });

program
  .command("mistakes [action]")
  .description("Manage mistake bank.")
  .option("--problem <problemId>")
  .option("--title <title>")
  .option("--category <category>")
  .option("--topic <topic>")
  .option("--pattern <pattern>")
  .option("--fix <fix>")
  .action(async (action = "stats", options) => {
    const workspace = await ensureWorkspace();
    if (action === "add") {
      const mistake = createMistake({
        problemId: options.problem ?? "unknown",
        title: options.title ?? "Logged mistake",
        category: (options.category ?? "missed edge case") as MistakeCategory,
        topic: options.topic,
        pattern: options.pattern,
        fix: options.fix
      });
      workspace.mistakes.push(mistake);
      await saveWorkspace(workspace);
      printSuccess(`Added mistake: ${mistake.title}`);
      return;
    }
    console.log(JSON.stringify(mistakeStats(workspace.mistakes), null, 2));
  });

program
  .command("mindmap")
  .description("Generate an interactive roadmap mindmap.")
  .option("--goal <goal>", "dsa, cp, amazon", "dsa")
  .option("--interactive", "write an interactive HTML file")
  .option("--export <format>", "markdown, html, json")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const node = generateRoadmapPlan({ goal: options.goal, weakTopics: detectWeakAreas(workspace).map((area) => area.topic) }).mindmap;
    const format = options.export ?? (options.interactive ? "html" : "markdown");
    const out = await outputMindmap(node, format);
    printSuccess(`Mindmap exported to ${out}`);
  });

program
  .command("chart")
  .description("Generate charts as SVG or HTML.")
  .option("--type <type>", "progress, weakness, company-readiness, cp-rating, topic-distribution, mistake-distribution", "progress")
  .option("--export <format>", "svg, html", "svg")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const analytics = analyzeWorkspace(workspace);
    const data =
      options.type === "mistake-distribution"
        ? analytics.mistakeDistribution
        : options.type === "topic-distribution" || options.type === "weakness"
          ? analytics.topicDistribution
          : analytics.platformDistribution;
    const svg = chartToSvg(data, `CP Forge ${options.type}`);
    const file = path.join(workspacePaths().exports, `chart-${options.type}.${options.export === "html" ? "html" : "svg"}`);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, options.export === "html" ? `<!doctype html><html><body>${svg}</body></html>` : svg, "utf8");
    printSuccess(`Chart exported to ${file}`);
  });

program
  .command("export")
  .description("Export local data.")
  .option("--format <format>", "sheets, notion, markdown, obsidian, calendar, json, html", "markdown")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const file = await exportByFormat(workspace, options.format);
    printSuccess(`Exported ${options.format} to ${file}`);
  });

program
  .command("import <file>")
  .description("Import CP Forge JSON or custom CSV.")
  .action(async (file) => {
    if (file.endsWith(".csv")) {
      const workspace = await ensureWorkspace();
      workspace.problems.push(...parseCustomCsv(await fs.readFile(file, "utf8")));
      await saveWorkspace(workspace);
      printSuccess(`Imported custom CSV ${file}.`);
    } else {
      await importWorkspace(file);
      printSuccess(`Imported workspace ${file}.`);
    }
  });

program
  .command("portfolio")
  .description("Generate GitHub README and HTML portfolio output.")
  .option("--github-readme", "write GitHub README section")
  .option("--html", "write HTML portfolio")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const exportsDir = workspacePaths().exports;
    await fs.mkdir(exportsDir, { recursive: true });
    const markdownFile = path.join(exportsDir, options.githubReadme ? "github-readme-section.md" : "portfolio.md");
    await fs.writeFile(markdownFile, portfolioMarkdown(workspace), "utf8");
    if (options.html) await fs.writeFile(path.join(exportsDir, "portfolio.html"), portfolioHtml(workspace), "utf8");
    printSuccess(`Portfolio exported to ${markdownFile}`);
  });

program
  .command("extension-import <file>")
  .description("Import browser extension session JSON into the workspace.")
  .action(async (file) => {
    const workspace = await ensureWorkspace();
    const raw = JSON.parse(await fs.readFile(file, "utf8")) as {
      sessions?: Record<string, { url: string; title: string; status: string; notes: string }>;
    };
    let imported = 0;
    for (const session of Object.values(raw.sessions ?? {})) {
      const match = workspace.problems.find((p) => p.url === session.url || p.title === session.title);
      if (match) {
        match.status = session.status as Problem["status"];
        match.notes = session.notes;
        imported += 1;
      }
    }
    await saveWorkspace(workspace);
    printSuccess(`Merged ${imported} extension sessions into .cpforge workspace.`);
  });

program
  .description("Show today's warmup, main, review, upsolve, and reflection plan.")
  .action(async () => {
    const workspace = await ensureWorkspace();
    const plan = buildDailyPlan(workspace, workspace.profile);
    console.log("\nToday's CP Forge Plan\n");
    console.log(`Warmup: ${plan.warmup.title} (${plan.warmup.url})`);
    plan.main.forEach((problem, index) => console.log(`Main ${index + 1}: ${problem.title} (${problem.url})`));
    if (plan.reviewProblemId) console.log(`Review: ${plan.reviewProblemId}`);
    if (plan.upsolveProblemId) console.log(`Upsolve: ${plan.upsolveProblemId}`);
    console.log(`Reflection: ${plan.reflection}`);
    console.log(`\nNext action: ${plan.nextAction.action} because ${plan.nextAction.reason}`);
  });

program
  .command("stuck")
  .description("Explain why progress feels blocked.")
  .action(async () => {
    const workspace = await ensureWorkspace();
    const diagnosis = buildStuckDiagnosis(workspace);
    console.log("\nWhy am I stuck?\n");
    console.log(diagnosis.summary);
    diagnosis.reasons.forEach((reason, index) => console.log(`${index + 1}. ${reason}`));
  });

program
  .command("flashcards")
  .description("Export Anki-ready flashcards from mistakes and patterns.")
  .option("--format <format>", "anki, markdown, json", "anki")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const exportsDir = workspacePaths().exports;
    await fs.mkdir(exportsDir, { recursive: true });
    const file =
      options.format === "json"
        ? path.join(exportsDir, "flashcards.json")
        : options.format === "markdown"
          ? path.join(exportsDir, "flashcards.md")
          : path.join(exportsDir, "flashcards-anki.csv");
    const content =
      options.format === "json"
        ? JSON.stringify(workspace.mistakes, null, 2)
        : options.format === "markdown"
          ? mistakesToFlashcardsMarkdown(workspace.mistakes)
          : mistakesToAnkiCsv(workspace.mistakes);
    await fs.writeFile(file, content, "utf8");
    printSuccess(`Flashcards exported to ${file}`);
  });

program
  .command("notebook")
  .description("Generate a local CP notebook with templates.")
  .option("--lang <lang>", "cpp, python, java", "cpp")
  .option("--style <style>", "icpc, interview", "icpc")
  .action(async (options) => {
    const notebookDir = path.join(process.cwd(), "notebook");
    await fs.mkdir(notebookDir, { recursive: true });
    const sections = ["math", "graphs", "dp", "strings", "data-structures", "geometry"];
    for (const section of sections) {
      await fs.writeFile(
        path.join(notebookDir, `${section}.md`),
        `# ${section}\n\n## Templates\n\n- Add your ${options.style} notes here.\n- Language: ${options.lang}\n`,
        "utf8"
      );
    }
    await fs.writeFile(
      path.join(notebookDir, `templates.${options.lang === "python" ? "py" : options.lang === "java" ? "java" : "cpp"}`),
      options.lang === "python"
        ? "# CP Forge notebook templates\n"
        : options.lang === "java"
          ? "// CP Forge notebook templates\n"
          : "// CP Forge notebook templates\n#include <bits/stdc++.h>\nusing namespace std;\n",
      "utf8"
    );
    printSuccess(`Notebook generated in ${notebookDir}`);
  });

program
  .command("pack")
  .description("Install a local community pack into the workspace.")
  .argument("[action]", "add or list", "list")
  .argument("[name]", "pack name such as amazon-45 or blind-75")
  .action(async (action, name) => {
    const packsDir = path.join(findRepoRoot(), "packs");
    if (action === "list") {
      const packs = (await fs.readdir(packsDir).catch(() => [])).filter((entry) => entry.endsWith(".json"));
      printList(packs.map((pack) => pack.replace(".json", "")));
      return;
    }
    if (action === "add" && name) {
      const packPath = path.join(packsDir, `${name}.json`);
      const pack = JSON.parse(await fs.readFile(packPath, "utf8")) as {
        problems?: Array<Problem | string>;
        title?: string;
      };
      const workspace = await ensureWorkspace();
      const resolved = (pack.problems ?? [])
        .map((entry) => (typeof entry === "string" ? bank().find((problem) => problem.id === entry) : entry))
        .filter((problem): problem is Problem => Boolean(problem));
      if (resolved.length) {
        workspace.problems = mergeProblems(workspace.problems, resolved);
      }
      await saveWorkspace(workspace);
      printSuccess(`Installed pack ${name}${pack.title ? `: ${pack.title}` : ""} with ${resolved.length} problems.`);
      return;
    }
    throw new Error("Use `cp-forge pack list` or `cp-forge pack add <name>`.");
  });

program
  .command("team")
  .description("Create local team training exports without a backend.")
  .argument("[action]", "init, sheet, or report", "init")
  .option("--icpc", "generate ICPC role sheet")
  .action(async (action, options) => {
    const teamDir = path.join(process.cwd(), ".cpforge", "team");
    await fs.mkdir(teamDir, { recursive: true });
    if (action === "init") {
      const manifest = {
        name: "CP Forge Team",
        createdAt: new Date().toISOString(),
        roles: ["graphs", "dp", "math", "implementation", "geometry", "strings"]
      };
      await fs.writeFile(path.join(teamDir, "team.json"), JSON.stringify(manifest, null, 2), "utf8");
      printSuccess(`Team workspace initialized at ${teamDir}`);
      return;
    }
    if (action === "sheet") {
      const roles = options.icpc
        ? ["math", "graphs", "dp", "implementation", "geometry", "strings", "data-structures"]
        : ["arrays", "graphs", "dp", "trees"];
      await fs.writeFile(path.join(teamDir, "team-sheet.json"), JSON.stringify({ roles, problems: bank().slice(0, 12) }, null, 2), "utf8");
      printSuccess("Team sheet exported.");
      return;
    }
    const workspace = await ensureWorkspace();
    await fs.writeFile(
      path.join(teamDir, "team-report.json"),
      JSON.stringify({ analytics: analyzeWorkspace(workspace), members: 1, generatedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
    printSuccess("Team report exported.");
  });

program
  .command("profile-card")
  .description("Generate a GitHub README profile card SVG.")
  .action(async () => {
    const workspace = await ensureWorkspace();
    const exportsDir = workspacePaths().exports;
    await fs.mkdir(exportsDir, { recursive: true });
    const file = path.join(exportsDir, "cp-forge-card.svg");
    await fs.writeFile(file, profileCardSvg(workspace), "utf8");
    printSuccess(`Profile card exported to ${file}`);
  });

program
  .command("contest")
  .description("Create a local contest practice plan or list upcoming Codeforces contests.")
  .option("--platform <platform>", "platform", "codeforces")
  .option("--rating <rating>", "target rating", parseNumber, 1200)
  .option("--upcoming", "fetch upcoming contests when online")
  .action(async (options) => {
    const workspace = await ensureWorkspace();
    const analytics = analyzeWorkspace(workspace);
    if (options.upcoming && options.platform === "codeforces") {
      try {
        const client = new CodeforcesApiClient();
        const rows = (await client.contestList()) as Array<{
          id: number;
          name: string;
          type: string;
          phase: string;
          startTimeSeconds?: number;
          durationSeconds?: number;
        }>;
        const alerts = upcomingContestAlerts(parseCodeforcesContests(rows));
        await writeJson(path.join(workspacePaths().exports, "contest-alerts.json"), alerts);
        alerts.slice(0, 5).forEach((alert) => console.log(`${alert.startsAt.slice(0, 10)} · ${alert.name} · ${alert.url}`));
        printSuccess(`Saved ${alerts.length} upcoming contests to .cpforge/exports/contest-alerts.json`);
      } catch (error) {
        printInfo(`Could not fetch contests offline: ${error instanceof Error ? error.message : "unknown"}`);
      }
    }
    const plan = buildVirtualContest(options.rating, options.platform, bank());
    workspace.contests.push({
      id: plan.id,
      platform: plan.platform,
      rating: plan.targetRating,
      problems: plan.problems.map((problem) => problem.id),
      createdAt: new Date().toISOString(),
      title: plan.title,
      checklist: plan.checklist
    });
    await saveWorkspace(workspace);
    await writeJson(path.join(workspacePaths().exports, "virtual-contest.json"), plan);
    console.log(contestReadinessMessage(analytics.solvedCount, analytics.upsolveCount));
    plan.checklist.forEach((item) => console.log(`- ${item}`));
    printSuccess(`Created ${options.platform} virtual contest with ${plan.problems.length} problems.`);
  });

program
  .command("dashboard")
  .description("Generate dashboard data for the web app.")
  .action(async () => {
    const workspace = await ensureWorkspace();
    await writeJson(path.join(workspacePaths().exports, "dashboard-data.json"), {
      workspace,
      analytics: analyzeWorkspace(workspace),
      today: buildDailyPlan(workspace, workspace.profile),
      weekly: buildWeeklyPlan(workspace, workspace.profile),
      weakAreas: detectWeakAreas(workspace)
    });
    printSuccess("Dashboard data exported to .cpforge/exports/dashboard-data.json");
  });

program
  .command("reset")
  .description("Delete local .cpforge data.")
  .option("--yes", "confirm deletion")
  .action(async (options) => {
    if (!options.yes) {
      throw new Error("Pass --yes to delete local CP Forge data.");
    }
    await deleteWorkspace();
    printSuccess("Deleted .cpforge workspace.");
  });

await program.parseAsync(process.argv);

function profileFromOptions(options: Record<string, unknown>): Partial<Profile> {
  return {
    preferredLanguage: String(options.language ?? "cpp"),
    goal: String(options.goal ?? "cp"),
    codeforcesHandle: typeof options.cf === "string" ? options.cf : undefined,
    leetcodeHandle: typeof options.leetcode === "string" ? options.leetcode : undefined,
    targetCompanies: typeof options.goal === "string" && !["cp", "dsa", "interview", "placement", "icpc"].includes(options.goal) ? [options.goal] : [],
    interviewTimelineDays: typeof options.days === "number" ? options.days : 45
  };
}

async function ensureWorkspace(profile?: Partial<Profile>): Promise<WorkspaceData> {
  try {
    const workspace = await loadWorkspace();
    if (workspace.problems.length === 0) {
      workspace.problems = bank().slice(0, 60);
      await saveWorkspace(workspace);
    }
    return workspace;
  } catch {
    const workspace = createWorkspace(profile);
    await initWorkspace(process.cwd(), profile);
    await saveWorkspace(workspace);
    return workspace;
  }
}

async function tryCodeforcesSync(workspace: WorkspaceData, handle: string): Promise<WorkspaceData> {
  const client = new CodeforcesApiClient();
  try {
    const submissions = (await client.userStatus(handle)) as Array<Record<string, unknown>>;
    const imported = submissionsToProblems(submissions);
    workspace.profile.codeforcesHandle = handle;
    workspace.problems = mergeProblems(workspace.problems, imported);
  } catch (error) {
    printInfo(`Codeforces sync skipped: ${(error as Error).message}`);
  }
  return workspace;
}

async function tryLeetCodeSync(workspace: WorkspaceData, handle: string): Promise<WorkspaceData> {
  const client = new LeetCodeGraphQLClient();
  try {
    const data = (await client.recentAcSubmissions(handle, 100)) as {
      recentAcSubmissionList?: Array<{ title: string; titleSlug: string; timestamp: string }>;
    };
    const imported = leetcodeSubmissionsToProblems(data.recentAcSubmissionList ?? []);
    workspace.profile.leetcodeHandle = handle;
    workspace.problems = mergeProblems(workspace.problems, imported);
  } catch (error) {
    printInfo(`LeetCode sync skipped: ${(error as Error).message}`);
  }
  return workspace;
}

function submissionsToProblems(submissions: Array<Record<string, unknown>>): Problem[] {
  return submissions.slice(0, 300).flatMap((submission) => {
    const problem = submission.problem as Record<string, unknown> | undefined;
    if (!problem) return [];
    const contestId = problem.contestId ? String(problem.contestId) : "problemset";
    const index = String(problem.index ?? "");
    const title = String(problem.name ?? `${contestId}${index}`);
    const verdict = String(submission.verdict ?? "");
    return [
      {
        id: `codeforces-${contestId}-${index}`,
        platform: "codeforces",
        platformId: `${contestId}${index}`,
        title,
        url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
        difficulty: problem.rating ? String(problem.rating) : "unknown",
        rating: typeof problem.rating === "number" ? problem.rating : undefined,
        topics: Array.isArray(problem.tags) ? (problem.tags as string[]) : [],
        patterns: [],
        companies: [],
        level: "cf",
        status: verdict === "OK" ? "solved" : "attempted",
        attempts: 1,
        confidence: verdict === "OK" ? 75 : 30,
        notes: "",
        mistakes: [],
        source: "codeforces-api"
      } satisfies Problem
    ];
  });
}

function mergeProblems(existing: Problem[], incoming: Problem[]): Problem[] {
  const byId = new Map(existing.map((problem) => [problem.id, problem]));
  for (const problem of incoming) {
    byId.set(problem.id, { ...byId.get(problem.id), ...problem });
  }
  return [...byId.values()];
}

async function writeLaunchExports(workspace: WorkspaceData, report: ReturnType<typeof buildLaunchReport>) {
  const exportsDir = workspacePaths().exports;
  await fs.mkdir(exportsDir, { recursive: true });
  await fs.writeFile(path.join(exportsDir, "cp-forge-report.json"), JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(path.join(exportsDir, "sheet.csv"), problemsToCsv(workspace.problems), "utf8");
  await fs.writeFile(path.join(exportsDir, "sheet.md"), problemsToMarkdown(workspace.problems), "utf8");
  await fs.writeFile(path.join(exportsDir, "reviews.ics"), reviewsToIcs(workspace.reviews), "utf8");
  await fs.writeFile(path.join(exportsDir, "mindmap.html"), mindmapToHtml(report.roadmap.mindmap), "utf8");
  await fs.writeFile(path.join(exportsDir, "portfolio.md"), portfolioMarkdown(workspace), "utf8");
  await exportWorkspace(path.join(exportsDir, "workspace.json"));
}

async function outputRoadmap(plan: ReturnType<typeof generateRoadmapPlan>, format: string) {
  const exportsDir = workspacePaths().exports;
  await fs.mkdir(exportsDir, { recursive: true });
  if (format === "json") {
    const file = path.join(exportsDir, "roadmap.json");
    await fs.writeFile(file, JSON.stringify(plan, null, 2), "utf8");
    console.log(file);
    return;
  }
  const markdown = [`# ${plan.goal} Roadmap`, "", `Days: ${plan.days}`, "", "## Topic Order", ...plan.topicOrder.map((topic) => `- ${topic}`), "", "## Weekly Milestones", ...plan.weeklyMilestones.map((milestone) => `- Week ${milestone.week}: ${milestone.milestone}`)].join("\n");
  const file = path.join(exportsDir, format === "sheets" ? "roadmap.csv" : "roadmap.md");
  await fs.writeFile(file, format === "sheets" ? plan.topicOrder.map((topic, index) => `${index + 1},${topic}`).join("\n") : markdown, "utf8");
  console.log(markdown);
}

async function outputSheet(sheet: Problem[], format: string, stem: string) {
  const exportsDir = workspacePaths().exports;
  await fs.mkdir(exportsDir, { recursive: true });
  const file = path.join(exportsDir, `${stem}.${format === "json" ? "json" : format === "csv" ? "csv" : "md"}`);
  const content = format === "json" ? JSON.stringify(sheet, null, 2) : format === "csv" ? problemsToCsv(sheet) : problemsToMarkdown(sheet);
  await fs.writeFile(file, content, "utf8");
  console.log(content);
}

async function outputMindmap(node: ReturnType<typeof generateRoadmapPlan>["mindmap"], format: string) {
  const exportsDir = workspacePaths().exports;
  await fs.mkdir(exportsDir, { recursive: true });
  const file = path.join(exportsDir, `mindmap.${format === "html" ? "html" : format === "json" ? "json" : "md"}`);
  const content = format === "html" ? mindmapToHtml(node) : format === "json" ? JSON.stringify(node, null, 2) : mindmapToMarkdown(node);
  await fs.writeFile(file, content, "utf8");
  return file;
}

async function exportByFormat(workspace: WorkspaceData, format: string) {
  const exportsDir = workspacePaths().exports;
  await fs.mkdir(exportsDir, { recursive: true });
  const file =
    format === "calendar"
      ? path.join(exportsDir, "reviews.ics")
      : format === "json"
        ? path.join(exportsDir, "workspace.json")
        : format === "html"
          ? path.join(exportsDir, "portfolio.html")
          : path.join(exportsDir, `${format}.md`);
  const content =
    format === "calendar"
      ? reviewsToIcs(workspace.reviews)
      : format === "json"
        ? workspaceToJson(workspace)
        : format === "html"
          ? portfolioHtml(workspace)
          : problemsToMarkdown(workspace.problems);
  await fs.writeFile(file, content, "utf8");
  return file;
}

function printWorkspaceLocation() {
  console.log(`Workspace: ${workspacePaths().dir}`);
}

function parseNumber(value: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Expected number, got ${value}`);
  return number;
}

function bank(): Problem[] {
  return extendedProblemBank(findRepoRoot());
}

function findRepoRoot(): string {
  let current = process.cwd();
  while (true) {
    if (existsSync(path.join(current, "pnpm-workspace.yaml"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return process.cwd();
    current = parent;
  }
}
