import path from "node:path";

const PROJECT_ROOT = process.cwd();

export const PATHS = {
  projectRoot: PROJECT_ROOT,
  source: path.join(PROJECT_ROOT, "src"),
  tests: path.join(PROJECT_ROOT, "tests"),
  artifacts: path.join(PROJECT_ROOT, "artifacts"),
  workspaces: path.join(PROJECT_ROOT, "workspaces"),
} as const;
