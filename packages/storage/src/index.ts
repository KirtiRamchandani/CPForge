import { promises as fs } from "node:fs";
import path from "node:path";
import type { Profile, WorkspaceData } from "@cp-forge/schemas";
import { emptyWorkspace, profileSchema, workspaceDataSchema } from "@cp-forge/schemas";

export const workspaceDirName = ".cpforge";

export interface WorkspacePaths {
  root: string;
  dir: string;
  config: string;
  profile: string;
  accounts: string;
  problems: string;
  progress: string;
  mistakes: string;
  reviews: string;
  upsolve: string;
  contests: string;
  mindmaps: string;
  notes: string;
  exports: string;
  cache: string;
}

export const workspacePaths = (root = process.cwd()): WorkspacePaths => {
  const dir = path.join(root, workspaceDirName);
  return {
    root,
    dir,
    config: path.join(dir, "config.json"),
    profile: path.join(dir, "profile.json"),
    accounts: path.join(dir, "accounts.json"),
    problems: path.join(dir, "problems.json"),
    progress: path.join(dir, "progress.json"),
    mistakes: path.join(dir, "mistakes.json"),
    reviews: path.join(dir, "reviews.json"),
    upsolve: path.join(dir, "upsolve.json"),
    contests: path.join(dir, "contests.json"),
    mindmaps: path.join(dir, "mindmaps.json"),
    notes: path.join(dir, "notes"),
    exports: path.join(dir, "exports"),
    cache: path.join(dir, "cache")
  };
};

export const initWorkspace = async (root = process.cwd(), profileInput: Partial<Profile> = {}): Promise<WorkspaceData> => {
  const paths = workspacePaths(root);
  await fs.mkdir(paths.notes, { recursive: true });
  await fs.mkdir(paths.exports, { recursive: true });
  await fs.mkdir(paths.cache, { recursive: true });

  const profile = profileSchema.parse(profileInput);
  const workspace = emptyWorkspace(profile);
  await writeJson(paths.config, {
    version: "0.1.0",
    localFirst: true,
    network: { codeforces: "user-triggered", leetcodeGraphql: "disabled" }
  });
  await writeJson(paths.profile, workspace.profile);
  await writeJson(paths.accounts, {
    codeforces: profile.codeforcesHandle,
    leetcode: profile.leetcodeHandle,
    atcoder: profile.atcoderHandle,
    codechef: profile.codechefHandle
  });
  await writeJson(paths.problems, []);
  await writeJson(paths.progress, {});
  await writeJson(paths.mistakes, []);
  await writeJson(paths.reviews, []);
  await writeJson(paths.upsolve, []);
  await writeJson(paths.contests, []);
  await writeJson(paths.mindmaps, []);
  return workspace;
};

export const loadWorkspace = async (root = process.cwd()): Promise<WorkspaceData> => {
  const paths = workspacePaths(root);
  const profile = profileSchema.parse(await readJson(paths.profile, {}));
  const workspace = workspaceDataSchema.parse({
    profile,
    problems: await readJson(paths.problems, []),
    mistakes: await readJson(paths.mistakes, []),
    reviews: await readJson(paths.reviews, []),
    upsolve: await readJson(paths.upsolve, []),
    contests: await readJson(paths.contests, []),
    mindmaps: await readJson(paths.mindmaps, [])
  });
  return workspace;
};

export const saveWorkspace = async (workspace: WorkspaceData, root = process.cwd()): Promise<void> => {
  const paths = workspacePaths(root);
  await fs.mkdir(paths.dir, { recursive: true });
  await writeJson(paths.profile, workspace.profile);
  await writeJson(paths.problems, workspace.problems);
  await writeJson(paths.mistakes, workspace.mistakes);
  await writeJson(paths.reviews, workspace.reviews);
  await writeJson(paths.upsolve, workspace.upsolve);
  await writeJson(paths.contests, workspace.contests);
  await writeJson(paths.mindmaps, workspace.mindmaps);
};

export const deleteWorkspace = async (root = process.cwd()): Promise<void> => {
  await fs.rm(workspacePaths(root).dir, { recursive: true, force: true });
};

export const exportWorkspace = async (target: string, root = process.cwd()): Promise<void> => {
  const workspace = await loadWorkspace(root);
  await writeJson(target, workspace);
};

export const importWorkspace = async (source: string, root = process.cwd()): Promise<WorkspaceData> => {
  const workspace = workspaceDataSchema.parse(await readJson(source, {}));
  await saveWorkspace(workspace, root);
  return workspace;
};

export const writeJson = async (file: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

export const readJson = async <T>(file: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return fallback;
    throw error;
  }
};
