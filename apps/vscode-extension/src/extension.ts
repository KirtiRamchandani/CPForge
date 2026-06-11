import * as vscode from "vscode";

interface WorkspaceFile {
  profile?: { preferredLanguage?: string; goal?: string };
  problems?: Array<{ id: string; title: string; status?: string; url?: string; notes?: string }>;
  mistakes?: Array<{ id: string; title: string; category: string; description?: string }>;
}

let timerStart: number | undefined;
let timerInterval: ReturnType<typeof setInterval> | undefined;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    command("cpForge.startProblem", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Problem title or URL" });
      if (!title) return;
      await ensureCpForgeDirs();
      const uri = noteUri(title);
      if (!(await exists(uri))) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(problemTemplate(title), "utf8"));
      }
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
      await upsertProblem(title, "solving");
      vscode.window.showInformationMessage(`CP Forge: started ${title}`);
    }),
    command("cpForge.addMistake", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Mistake title" });
      if (!title) return;
      const category =
        (await vscode.window.showQuickPick(["off-by-one", "wrong complexity", "missed edge case", "overflow", "tle", "wrong algorithm"], {
          placeHolder: "Category"
        })) ?? "missed edge case";
      const description = await vscode.window.showInputBox({ prompt: "What went wrong?" });
      const workspace = await readWorkspace();
      workspace.mistakes ??= [];
      workspace.mistakes.push({ id: `mistake-${Date.now()}`, title, category, description: description ?? "" });
      await writeWorkspace(workspace);
      vscode.window.showInformationMessage("CP Forge: mistake saved");
    }),
    command("cpForge.addNote", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Note title" });
      if (!title) return;
      await ensureCpForgeDirs();
      const doc = await vscode.workspace.openTextDocument(noteUri(title));
      await vscode.window.showTextDocument(doc);
    }),
    command("cpForge.openDesignDoc", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Problem for design doc" });
      if (!title) return;
      await ensureCpForgeDirs();
      const uri = designUri(title);
      if (!(await exists(uri))) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(designTemplate(title), "utf8"));
      }
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    }),
    command("cpForge.markSolved", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Problem title to mark solved" });
      if (!title) return;
      await upsertProblem(title, "solved");
      stopTimer();
      vscode.window.showInformationMessage(`CP Forge: marked ${title} solved`);
    }),
    command("cpForge.showChecklist", () =>
      vscode.window.showQuickPick(
        [
          "Integer overflow / underflow checked",
          "Multiple test cases handled",
          "Boundary cases tested",
          "State cleared between cases",
          "Complexity fits constraints",
          "Sample tests match expected output"
        ],
        { placeHolder: "CP Forge pre-submit checklist", canPickMany: true }
      )
    ),
    command("cpForge.startTimer", () => {
      timerStart = Date.now();
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (!timerStart) return;
        const elapsed = Math.floor((Date.now() - timerStart) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const secs = String(elapsed % 60).padStart(2, "0");
        vscode.window.setStatusBarMessage(`CP Forge timer: ${mins}:${secs}`, 1000);
      }, 1000);
      vscode.window.showInformationMessage("CP Forge timer started");
    }),
    command("cpForge.stopTimer", () => {
      const elapsed = stopTimer();
      if (elapsed !== undefined) {
        vscode.window.showInformationMessage(`CP Forge session: ${formatElapsed(elapsed)}`);
      }
    }),
    command("cpForge.runSamples", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Open a solution file first.");
        return;
      }
      const lang = editor.document.languageId;
      const sampleInput = await vscode.window.showInputBox({
        prompt: "Sample input (paste test case)",
        placeHolder: "3\n1 2 3"
      });
      if (sampleInput === undefined) return;
      const inputUri = vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "samples", "input.txt");
      await ensureCpForgeDirs();
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "samples"));
      await vscode.workspace.fs.writeFile(inputUri, Buffer.from(sampleInput, "utf8"));
      const term = vscode.window.createTerminal({ name: "CP Forge Samples" });
      const file = editor.document.fileName;
      if (lang === "cpp") term.sendText(`g++ -std=c++17 -O2 "${file}" -o cpforge-run && cpforge-run < "${inputUri.fsPath}"`);
      else if (lang === "python") term.sendText(`python "${file}" < "${inputUri.fsPath}"`);
      else if (lang === "rust") term.sendText(`rustc "${file}" -o cpforge-run && cpforge-run < "${inputUri.fsPath}"`);
      else term.sendText(`echo "Run your ${lang} solution with input at ${inputUri.fsPath}"`);
      term.show();
    }),
    command("cpForge.markAttempted", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Problem title to mark attempted" });
      if (!title) return;
      await upsertProblem(title, "attempted");
      vscode.window.showInformationMessage(`CP Forge: marked ${title} attempted`);
    }),
    command("cpForge.sendToReview", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Problem to schedule for review" });
      if (!title) return;
      await upsertProblem(title, "review_later");
      vscode.window.showInformationMessage(`CP Forge: ${title} flagged for review`);
    }),
    command("cpForge.openNotes", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Open notes for problem" });
      if (!title) return;
      const doc = await vscode.workspace.openTextDocument(noteUri(title));
      await vscode.window.showTextDocument(doc);
    }),
    command("cpForge.weakTopicWarning", async () => {
      const workspace = await readWorkspace();
      const topics = [...new Set((workspace.mistakes ?? []).map((m) => m.category))];
      vscode.window.showWarningMessage(
        topics.length
          ? `CP Forge: repeated mistake categories — ${topics.slice(0, 4).join(", ")}`
          : "CP Forge: log mistakes to unlock weak-topic warnings."
      );
    }),
    command("cpForge.exportSession", async () => {
      await ensureCpForgeDirs();
      const exportUri = vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "exports", "vscode-session.json");
      const workspace = await readWorkspace();
      await vscode.workspace.fs.writeFile(
        exportUri,
        Buffer.from(JSON.stringify({ exportedAt: new Date().toISOString(), workspace, timerSeconds: timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0 }, null, 2), "utf8")
      );
      vscode.window.showInformationMessage(`CP Forge: exported to ${exportUri.fsPath}`);
    })
  );
}

export function deactivate() {
  stopTimer();
}

const command = (name: string, callback: (...args: unknown[]) => unknown) => vscode.commands.registerCommand(name, callback);

const workspaceRoot = () => vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
const sanitize = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
const noteUri = (title: string) => vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "notes", `${sanitize(title)}.md`);
const designUri = (title: string) => vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "notes", `${sanitize(title)}-design.md`);
const workspaceUri = () => vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "problems.json");

async function ensureCpForgeDirs() {
  for (const segment of [".cpforge", ".cpforge/notes", ".cpforge/exports", ".cpforge/samples"]) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceRoot(), ...segment.split("/")));
  }
}

async function exists(uri: vscode.Uri) {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

function problemTemplate(title: string) {
  return `# ${title}\n\n## Approach\n\n## Mistakes\n\n## Edge Cases\n\n## Complexity\nTime: O()\nSpace: O()\n`;
}

function designTemplate(title: string) {
  return `# ${title} — Design Doc\n\n## Problem restatement\n\n## Observations\n\n## Algorithm\n\n## Proof / invariants\n\n## Complexity\n\n## Test plan\n`;
}

async function readWorkspace(): Promise<WorkspaceFile> {
  try {
    const raw = await vscode.workspace.fs.readFile(workspaceUri());
    return JSON.parse(Buffer.from(raw).toString("utf8")) as WorkspaceFile;
  } catch {
    return { problems: [], mistakes: [] };
  }
}

async function writeWorkspace(workspace: WorkspaceFile) {
  await ensureCpForgeDirs();
  await vscode.workspace.fs.writeFile(workspaceUri(), Buffer.from(JSON.stringify(workspace, null, 2), "utf8"));
}

async function upsertProblem(title: string, status: string) {
  const workspace = await readWorkspace();
  workspace.problems ??= [];
  const id = sanitize(title);
  const existing = workspace.problems.find((problem) => problem.id === id);
  if (existing) existing.status = status;
  else workspace.problems.push({ id, title, status, url: title.startsWith("http") ? title : "" });
  await writeWorkspace(workspace);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = undefined;
  if (!timerStart) return undefined;
  const elapsed = Math.floor((Date.now() - timerStart) / 1000);
  timerStart = undefined;
  return elapsed;
}

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
