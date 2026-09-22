import { describe, expect, it, vi } from "vitest";

const { runProcessMock, resolveOpenCodeExecutableMock } =
  vi.hoisted(() => ({
    runProcessMock: vi.fn(),
    resolveOpenCodeExecutableMock: vi.fn(),
  }));

vi.mock("../src/runtime/process-runner.js", () => ({
  runProcess: runProcessMock,
}));

vi.mock("../src/runtime/opencode-resolver.js", () => ({
  resolveOpenCodeExecutable:
    resolveOpenCodeExecutableMock,
}));

import { runOpenCode } from "../src/runtime/opencode-runner.js";

describe("OpenCodeRunner", () => {
  const executable =
    "C:\\OpenCode\\opencode.exe";

  it("should run OpenCode with the requested model and prompt", async () => {
    resolveOpenCodeExecutableMock.mockResolvedValue(
      executable
    );

    runProcessMock.mockResolvedValue({
      command: executable,
      args: [
        "run",
        "--model",
        "opencode/test-model",
        "hello world",
      ],
      exitCode: 0,
      stdout: "success",
      stderr: "",
      timedOut: false,
      durationMs: 100,
    });

    const result = await runOpenCode({
      model: "opencode/test-model",
      prompt: "hello world",
    });

    expect(
      resolveOpenCodeExecutableMock
    ).toHaveBeenCalledTimes(1);

    expect(runProcessMock).toHaveBeenCalledWith(
      executable,
      [
        "run",
        "--model",
        "opencode/test-model",
        "hello world",
      ],
      {
        cwd: undefined,
        timeoutMs: undefined,
        env: undefined,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("success");
  });

  it("should pass cwd, timeout and environment to ProcessRunner", async () => {
    resolveOpenCodeExecutableMock.mockResolvedValue(
      executable
    );

    runProcessMock.mockResolvedValue({
      command: executable,
      args: [
        "run",
        "--model",
        "opencode/test-model",
        "build app",
      ],
      exitCode: 0,
      stdout: "done",
      stderr: "",
      timedOut: false,
      durationMs: 200,
    });

    const env = {
      TEST_ENV: "true",
    };

    await runOpenCode({
      model: "opencode/test-model",
      prompt: "build app",
      cwd: "D:\\workspace\\test",
      timeoutMs: 30_000,
      env,
    });

    expect(runProcessMock).toHaveBeenCalledWith(
      executable,
      [
        "run",
        "--model",
        "opencode/test-model",
        "build app",
      ],
      {
        cwd: "D:\\workspace\\test",
        timeoutMs: 30_000,
        env,
      }
    );
  });

  it("should return the ProcessRunner result unchanged", async () => {
    resolveOpenCodeExecutableMock.mockResolvedValue(
      executable
    );

    const processResult = {
      command: executable,
      args: [
        "run",
        "--model",
        "opencode/test-model",
        "test",
      ],
      exitCode: 1,
      stdout: "",
      stderr: "model failed",
      timedOut: false,
      durationMs: 500,
    };

    runProcessMock.mockResolvedValue(processResult);

    const result = await runOpenCode({
      model: "opencode/test-model",
      prompt: "test",
    });

    expect(result).toBe(processResult);
  });
});
