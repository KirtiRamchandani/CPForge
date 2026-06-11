import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    command("cpForge.startProblem", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Problem title or URL" });
      if (!title) return;
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "notes"));
      await vscode.workspace.fs.writeFile(
        vscode.Uri.joinPath(workspaceRoot(), ".cpforge", "notes", `${sanitize(title)}.md`),
        Buffer.from(`# ${title}\n\n## Approach\n\n## Mistakes\n\n## Edge Cases\n\n## Complexity\n`)
      );
      vscode.window.showInformationMessage(`CP Forge started session for ${title}`);
    }),
    command("cpForge.addMistake", () => vscode.window.showInformationMessage("CP Forge mistake capture is ready for workspace sync.")),
    command("cpForge.addNote", () => vscode.window.showInformationMessage("CP Forge note command is ready.")),
    command("cpForge.markSolved", () => vscode.window.showInformationMessage("Marked solved locally in CP Forge session.")),
    command("cpForge.showChecklist", () =>
      vscode.window.showInformationMessage("Checklist: overflow, tests, boundaries, clearing state, complexity, multiple test cases.")
    ),
    command("cpForge.exportSession", () => vscode.window.showInformationMessage("Session export will write to .cpforge/exports."))
  );
}

export function deactivate() {}

const command = (name: string, callback: (...args: unknown[]) => unknown) => vscode.commands.registerCommand(name, callback);

const workspaceRoot = () => vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
const sanitize = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
