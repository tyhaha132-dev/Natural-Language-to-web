import { describe, expect, it, vi } from "vitest";

const { runProcessMock } = vi.hoisted(() => ({
  runProcessMock: vi.fn(),
}));

vi.mock("../src/runtime/process-runner.js", () => ({
  runProcess: runProcessMock,
}));

import {
  checkDocker,
  checkEnvironment,
  checkNode,
  checkNpm,
} from "../src/infrastructure/environment/environment-check.js";

describe("EnvironmentCheck", () => {
  it("should detect Node.js", async () => {
    runProcessMock.mockResolvedValue({
      command: process.execPath,
      args: ["--version"],
      exitCode: 0,
      stdout: "v24.0.0\r\n",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    });

    const result = await checkNode();

    expect(result).toEqual({
      name: "node",
      available: true,
      version: "v24.0.0",
      error: null,
    });
  });

  it("should detect npm", async () => {
    runProcessMock.mockResolvedValue({
      command: "npm.cmd",
      args: ["--version"],
      exitCode: 0,
      stdout: "11.0.0\r\n",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    });

    const result = await checkNpm();

    expect(result).toEqual({
      name: "npm",
      available: true,
      version: "11.0.0",
      error: null,
    });
  });

  it("should report Docker as unavailable when the command fails", async () => {
    runProcessMock.mockResolvedValue({
      command: "docker",
      args: ["--version"],
      exitCode: 1,
      stdout: "",
      stderr: "docker not found",
      timedOut: false,
      durationMs: 10,
    });

    const result = await checkDocker();

    expect(result).toEqual({
      name: "docker",
      available: false,
      version: null,
      error: "docker not found",
    });
  });

  it("should handle process execution errors", async () => {
    runProcessMock.mockRejectedValue(
      new Error("spawn failed")
    );

    const result = await checkDocker();

    expect(result).toEqual({
      name: "docker",
      available: false,
      version: null,
      error: "spawn failed",
    });
  });

  it("should check all required environment dependencies", async () => {
    runProcessMock.mockResolvedValue({
      command: "test",
      args: ["--version"],
      exitCode: 0,
      stdout: "version\r\n",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    });

    const results = await checkEnvironment();

    expect(results).toHaveLength(3);
    expect(results.map((result) => result.name)).toEqual([
      "node",
      "npm",
      "docker",
    ]);
  });
});
