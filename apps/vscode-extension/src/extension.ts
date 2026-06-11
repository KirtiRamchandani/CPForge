import * as vscode from "vscode";

interface WorkspaceFile {
  profile?: { preferredLanguage?: string; goal?: string };
  problems?: Array<{ id: string; title: string; status?: string; url?: string }>;
  mistakes?: Array<{ id: string; title: string; category: string; description?: string }>;
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    command("cpForge.startProblem", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Problem title or URL" });
      if (!title) return;
      await ensureCpForgeDirs();
      await vscode.workspace.fs.writeFile(noteUri(title), Buffer.from(problemTemplate(title), "utf8"));
      await upsertProblem(title, "solving");
      vscode.window.showInformationMessage(`CP Forge started session for ${title}`);
    }),
    command("cpForge.addMistake", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Mistake title" });
      if (!title) return;
      const category = (await vscode.window.showQuickPick(["off-by-one", "wrong complexity", "missed edge case", "overflow"], { placeHolder: "Category" })) ?? "missed edge case";
      const workspace = await readWorkspace();
      workspace.mistakes ??= [];
      workspace.mistakes.push({ id: `mistake-${Date.now()}`, title, category, description: "" });
      await writeWorkspace(workspace);
      vscode.window.showInformationMessage("Mistake saved to .cpforge/mistakes.json");
    }),
    command("cpForge.addNote", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Note title" });
      if (!title) return;
      await ensureCpForgeDirs();
      const doc = await vscode.workspace.openTextDocument(noteUri(title));
      await vscode.window.showTextDocument(doc);
    }),
    command("cpForge.markSolved", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Problem title to mark solved" });
      if (!title) return;
      await upsertProblem(title, "solved");
      vscode.window.showInformationMessage(`Marked ${title} as solved in .cpforge/problems.json`);
    }),
    command("cpForge.showChecklist", () =>
      vscode.window.showInformationMessage("Checklist: overflow, tests, boundaries, clearing state, complexity, multiple test cases.")
    ),
    command("cpForge.exportSession", async () => {
      await ensureCpForgeDirs();
      const exportUri = vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "exports", "vscode-session.json");
      const workspace = await readWorkspace();
      await vscode.workspace.fs.writeFile(exportUri, Buffer.from(JSON.stringify({ exportedAt: new Date().toISOString(), workspace }, null, 2), "utf8"));
      vscode.window.showInformationMessage(`Exported session to ${exportUri.fsPath}`);
    })
  );
}

export function deactivate() {}

const command = (name: string, callback: (...args: unknown[]) => unknown) => vscode.commands.registerCommand(name, callback);

const workspaceRoot = () => vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
const sanitize = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
const noteUri = (title: string) => vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "notes", `${sanitize(title)}.md`);
const workspaceUri = () => vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "problems.json");

async function ensureCpForgeDirs() {
  for (const segment of [".cpforge", ".cpforge/notes", ".cpforge/exports"]) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceRoot(), ...segment.split("/")));
  }
}

function problemTemplate(title: string) {
  return `# ${title}\n\n## Approach\n\n## Mistakes\n\n## Edge Cases\n\n## Complexity\n`;
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
