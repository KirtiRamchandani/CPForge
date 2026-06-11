const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const dim = (text: string) => `\x1b[2m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

export const box = (title: string, lines: string[]): void => {
  const width = Math.max(title.length + 4, ...lines.map((line) => line.length + 4), 48);
  const bar = "─".repeat(width - 2);
  console.log(`\n┌${bar}┐`);
  console.log(`│ ${bold(title.padEnd(width - 4))} │`);
  console.log(`├${bar}┤`);
  for (const line of lines) {
    console.log(`│ ${line.padEnd(width - 4)} │`);
  }
  console.log(`└${bar}┘\n`);
};

export const launchBanner = (): void => {
  console.log(green("\n  ██████╗██████╗     ███████╗ ██████╗ ██████╗ ██████╗ ███████╗"));
  console.log(green(" ██╔════╝██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝"));
  console.log(green(" ██║     ██████╔╝    █████╗  ██║   ██║██████╔╝██║  ██║█████╗  "));
  console.log(green(" ██║     ██╔═══╝     ██╔══╝  ██║   ██║██╔══██╗██║  ██║██╔══╝  "));
  console.log(green(" ╚██████╗██║         ██║     ╚██████╔╝██║  ██║██████╔╝███████╗"));
  console.log(green("  ╚═════╝╚═╝         ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝"));
  console.log(dim("  The personal training OS for DSA, CP, and interviews.\n"));
};

export const printLaunchReport = (report: {
  title: string;
  goal: string;
  timelineDays: number;
  language: string;
  strengths: string[];
  weakAreas: Array<{ topic: string; reason: string }>;
  generated: string[];
  next: { action: string; reason: string };
}): void => {
  launchBanner();
  box("Mission", [
    `Goal: ${cyan(report.goal)}`,
    `Timeline: ${report.timelineDays} days`,
    `Language: ${report.language.toUpperCase()}`
  ]);
  box(
    "Strengths",
    (report.strengths.length ? report.strengths : ["Building baseline"]).map((s) => green(`▸ ${s}`))
  );
  box(
    "Weak areas",
    report.weakAreas.length
      ? report.weakAreas.map((a) => `▸ ${a.topic}: ${dim(a.reason)}`)
      : ["▸ Run cp-forge doctor after logging mistakes"]
  );
  box("Generated locally", report.generated.map((g) => `▸ ${g}`));
  box("Next action", [bold(report.next.action), dim(`Because ${report.next.reason}`)]);
  console.log(dim("  Workspace: .cpforge/  ·  Dashboard: cp-forge dashboard  ·  No cloud required\n"));
};

export const printList = (items: string[]): void => {
  if (items.length === 0) {
    console.log(dim("  (nothing yet)"));
    return;
  }
  items.forEach((item) => console.log(`  ${green("▸")} ${item}`));
};

export const printSuccess = (message: string): void => {
  console.log(green(`✓ CP Forge: ${message}`));
};

export const printInfo = (message: string): void => {
  console.log(cyan(`→ CP Forge: ${message}`));
};

export const printDoctorReport = (report: {
  diagnosis: string[];
  prescription: string[];
  snapshot: string;
  topMistake?: string;
}): void => {
  launchBanner();
  box("CP Forge Doctor — Diagnosis", report.diagnosis.map((line, index) => `${index + 1}. ${line}`));
  box("Prescription", report.prescription.map((line) => `▸ ${line}`));
  console.log(dim(`\n  ${report.snapshot}${report.topMistake ? ` · Top mistake: ${report.topMistake}` : ""}\n`));
};

export const printTodayPlan = (plan: {
  warmup: { title: string };
  main: Array<{ title: string }>;
  reviewProblemId?: string;
  upsolveProblemId?: string;
  reflection: string;
}): void => {
  box("Today's CP Forge Plan", [
    `Warmup: ${green(plan.warmup.title)}`,
    ...plan.main.map((p, i) => `Main ${i + 1}: ${p.title}`),
    `Review: ${plan.reviewProblemId ?? "After first solve"}`,
    `Upsolve: ${plan.upsolveProblemId ?? "Queue clear"}`,
    `Reflection: ${dim(plan.reflection)}`
  ]);
};

export const printStuckReport = (summary: string, reasons: string[]): void => {
  box("Why am I stuck?", [summary, ...reasons.map((r, i) => `${i + 1}. ${r}`)]);
};
