import { promises as fs } from "node:fs";
import path from "node:path";
import { PATHS } from "../config/paths.js";

function getWorkspacePath(pipelineId: string): string {
  if (pipelineId.trim() === "") {
    throw new Error("Pipeline ID must not be empty");
  }

  if (
    pipelineId.includes("/") ||
    pipelineId.includes("\\") ||
    pipelineId === "." ||
    pipelineId === ".." ||
    pipelineId.includes("..")
  ) {
    throw new Error("Invalid pipeline ID");
  }

  const workspaceRoot = path.resolve(PATHS.workspaces);
  const workspacePath = path.resolve(
    workspaceRoot,
    pipelineId
  );

  const relative = path.relative(
    workspaceRoot,
    workspacePath
  );

  if (
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error("Workspace path escapes workspace root");
  }

  return workspacePath;
}

export async function createWorkspace(
  pipelineId: string
): Promise<string> {
  const workspacePath = getWorkspacePath(pipelineId);

  await fs.mkdir(workspacePath, {
    recursive: true,
  });

  return workspacePath;
}

export async function workspaceExists(
  pipelineId: string
): Promise<boolean> {
  const workspacePath = getWorkspacePath(pipelineId);

  try {
    const stats = await fs.stat(workspacePath);

    return stats.isDirectory();
  } catch {
    return false;
  }
}

export function getWorkspaceDirectory(
  pipelineId: string
): string {
  return getWorkspacePath(pipelineId);
}
