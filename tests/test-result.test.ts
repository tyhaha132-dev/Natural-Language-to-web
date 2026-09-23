import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createTestResult,
} from "../src/testing/test-result.js";

describe("createTestResult", () => {
  it("should create a passed result", () => {
    const result =
      createTestResult({
        command: "npm.cmd",
        args: ["test"],
        exitCode: 0,
        stdout: "passed",
        stderr: "",
        timedOut: false,
        durationMs: 100,
      });

    expect(result).toEqual({
      status: "PASSED",
      command: "npm.cmd",
      args: ["test"],
      exitCode: 0,
      stdout: "passed",
      stderr: "",
      durationMs: 100,
    });
  });

  it("should create a failed result", () => {
    const result =
      createTestResult({
        command: "npm.cmd",
        args: ["test"],
        exitCode: 1,
        stdout: "",
        stderr: "test failed",
        timedOut: false,
        durationMs: 200,
      });

    expect(result.status).toBe(
      "FAILED"
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe(
      "test failed"
    );
  });

  it("should create a timed out result", () => {
    const result =
      createTestResult({
        command: "npm.cmd",
        args: ["test"],
        exitCode: null,
        stdout: "",
        stderr: "",
        timedOut: true,
        durationMs: 30_000,
      });

    expect(result.status).toBe(
      "TIMED_OUT"
    );

    expect(result.exitCode).toBeNull();
  });
});
