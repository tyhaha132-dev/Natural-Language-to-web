import { describe, expect, it, vi } from "vitest";

const { runProcessMock } = vi.hoisted(() => ({
  runProcessMock: vi.fn(),
}));

vi.mock("../src/runtime/process-runner.js", () => ({
  runProcess: runProcessMock,
}));

import { createGitManager } from "../src/git/git-manager.js";

describe("GitManager", () => {
  it("should initialize a git repository inside the workspace", async () => {
    runProcessMock.mockResolvedValue({
      command: "git",
      args: ["init"],
      exitCode: 0,
      stdout: "Initialized empty Git repository",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    });

    const git = createGitManager(workspace);

    const result = await git.init();

    expect(runProcessMock).toHaveBeenCalledWith(
      "git",
      ["init"],
      {
        cwd: workspace,
      }
    );

    expect(result.exitCode).toBe(0);
  });

  const workspace = "D:\\workspace\\test";

  it("should run git status inside the workspace", async () => {
    runProcessMock.mockResolvedValue({
      command: "git",
      args: ["status", "--short"],
      exitCode: 0,
      stdout: "",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    });

    const git = createGitManager(workspace);

    await git.status();

    expect(runProcessMock).toHaveBeenCalledWith(
      "git",
      ["status", "--short"],
      {
        cwd: workspace,
      }
    );
  });

  it("should run git diff inside the workspace", async () => {
    runProcessMock.mockResolvedValue({
      command: "git",
      args: ["diff"],
      exitCode: 0,
      stdout: "",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    });

    const git = createGitManager(workspace);

    await git.diff();

    expect(runProcessMock).toHaveBeenCalledWith(
      "git",
      ["diff"],
      {
        cwd: workspace,
      }
    );
  });

  it("should stage requested paths", async () => {
    runProcessMock.mockResolvedValue({
      command: "git",
      args: ["add", "--", "src", "package.json"],
      exitCode: 0,
      stdout: "",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    });

    const git = createGitManager(workspace);

    await git.stage([
      "src",
      "package.json",
    ]);

    expect(runProcessMock).toHaveBeenCalledWith(
      "git",
      [
        "add",
        "--",
        "src",
        "package.json",
      ],
      {
        cwd: workspace,
      }
    );
  });

  it("should reject staging with no paths", async () => {
    const git = createGitManager(workspace);

    await expect(
      git.stage([])
    ).rejects.toThrow(
      "Git stage requires at least one path"
    );

    expect(runProcessMock).not.toHaveBeenCalled();
  });

  it("should create a checkpoint commit", async () => {
    runProcessMock.mockResolvedValue({
      command: "git",
      args: ["commit", "-m", "checkpoint"],
      exitCode: 0,
      stdout: "[main abc123] checkpoint",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    });

    const git = createGitManager(workspace);

    const result = await git.checkpoint(
      "checkpoint"
    );

    expect(runProcessMock).toHaveBeenCalledWith(
      "git",
      [
        "commit",
        "-m",
        "checkpoint",
      ],
      {
        cwd: workspace,
      }
    );

    expect(result.exitCode).toBe(0);
  });

  it("should reject an empty checkpoint message", async () => {
    const git = createGitManager(workspace);

    await expect(
      git.checkpoint("   ")
    ).rejects.toThrow(
      "Git checkpoint message must not be empty"
    );

    expect(runProcessMock).not.toHaveBeenCalled();
  });
});
