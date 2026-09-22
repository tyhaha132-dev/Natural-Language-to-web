import { describe, expect, it } from "vitest";
import type { ProcessResult } from "../src/runtime/process-result.js";

describe("ProcessResult", () => {
  it("should represent a successful process result", () => {
    const result: ProcessResult = {
      command: "node",
      args: ["--version"],
      exitCode: 0,
      stdout: "v22.0.0",
      stderr: "",
      timedOut: false,
      durationMs: 100,
    };

    expect(result.command).toBe("node");
    expect(result.args).toEqual(["--version"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("v22.0.0");
    expect(result.stderr).toBe("");
    expect(result.timedOut).toBe(false);
    expect(result.durationMs).toBe(100);
  });

  it("should represent a timed out process", () => {
    const result: ProcessResult = {
      command: "npm",
      args: ["install"],
      exitCode: null,
      stdout: "",
      stderr: "",
      timedOut: true,
      durationMs: 600_000,
    };

    expect(result.exitCode).toBeNull();
    expect(result.timedOut).toBe(true);
  });
});
