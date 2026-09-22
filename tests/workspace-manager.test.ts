import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createWorkspace,
  getWorkspaceDirectory,
  workspaceExists,
} from "../src/workspace/workspace-manager.js";
import { PATHS } from "../src/config/paths.js";

const pipelineId = `workspace-test-${process.pid}`;

afterEach(async () => {
  await fs.rm(
    path.join(PATHS.workspaces, pipelineId),
    {
      recursive: true,
      force: true,
    }
  );
});

describe("WorkspaceManager", () => {
  it("should return a workspace inside the workspace root", () => {
    const workspace = getWorkspaceDirectory(pipelineId);

    expect(workspace).toBe(
      path.join(PATHS.workspaces, pipelineId)
    );
  });

  it("should create a workspace", async () => {
    const workspace = await createWorkspace(pipelineId);

    const stats = await fs.stat(workspace);

    expect(stats.isDirectory()).toBe(true);
  });

  it("should report whether a workspace exists", async () => {
    expect(
      await workspaceExists(pipelineId)
    ).toBe(false);

    await createWorkspace(pipelineId);

    expect(
      await workspaceExists(pipelineId)
    ).toBe(true);
  });

  it("should reject an empty pipeline ID", () => {
    expect(() =>
      getWorkspaceDirectory("")
    ).toThrow("Pipeline ID must not be empty");
  });

  it("should reject path traversal IDs", () => {
    expect(() =>
      getWorkspaceDirectory("../escape")
    ).toThrow("Invalid pipeline ID");

    expect(() =>
      getWorkspaceDirectory("foo\\bar")
    ).toThrow("Invalid pipeline ID");

    expect(() =>
      getWorkspaceDirectory("foo/bar")
    ).toThrow("Invalid pipeline ID");
  });
});
