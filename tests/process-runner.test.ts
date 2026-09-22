import { describe, expect, it } from "vitest";
import {
  runProcess,
  type ProcessOptions,
} from "../src/runtime/process-runner.js";

describe("ProcessRunner API", () => {
  it("should accept process options", () => {
    const options: ProcessOptions = {
      cwd: process.cwd(),
      timeoutMs: 5_000,
      env: {
        ...process.env,
      },
    };

    expect(options.cwd).toBe(process.cwd());
    expect(options.timeoutMs).toBe(5_000);
    expect(options.env).toBeDefined();
  });

  it("should expose runProcess as a function", () => {
    expect(runProcess).toBeTypeOf("function");
  });

  it("should execute a process and capture stdout", async () => {
    const result = await runProcess(
      process.execPath,
      ["-e", "console.log('process-ok')"]
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("process-ok");
    expect(result.stderr).toBe("");
    expect(result.timedOut).toBe(false);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should capture stderr from a failed process", async () => {
    const result = await runProcess(
      process.execPath,
      [
        "-e",
        "console.error('process-error'); process.exit(1)",
      ]
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("process-error");
    expect(result.timedOut).toBe(false);
  });
});

  it("should execute a Windows command script", async () => {
    if (process.platform !== "win32") {
      return;
    }	

    const result = await runProcess(
      "cmd.exe",
      ["/c", "echo", "windows-cmd-ok"]
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("windows-cmd-ok");
    expect(result.timedOut).toBe(false);
  });

  it("should execute a .cmd file directly on Windows", async () => {
    if (process.platform !== "win32") {
      return;
    }

    const result = await runProcess(
      "npm.cmd",
      ["--version"]
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).not.toBe("");
    expect(result.timedOut).toBe(false);
  });

it("should timeout a long-running process", async () => {
  const result = await runProcess(
    process.execPath,
    [
      "-e",
      "setTimeout(() => {}, 10000)",
    ],
    {
      timeoutMs: 100,
    }
  );

  expect(result.exitCode).toBeNull();
  expect(result.timedOut).toBe(true);
  expect(result.durationMs).toBeGreaterThanOrEqual(100);
});