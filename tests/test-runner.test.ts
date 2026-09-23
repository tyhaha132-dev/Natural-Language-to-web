import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createTestRunner,
} from "../src/testing/test-runner.js";

import * as processRunner from "../src/runtime/process-runner.js";

describe("TestRunner", () => {
  it("should run the test command in the workspace", async () => {
    const processResult = {
      command: "npm.cmd",
      args: ["test"],
      exitCode: 0,
      stdout: "tests passed",
      stderr: "",
      timedOut: false,
      durationMs: 10,
    };

    const runProcessSpy =
      vi.spyOn(
        processRunner,
        "runProcess"
      ).mockResolvedValue(
        processResult
      );

    const runner =
      createTestRunner({
        timeoutMs: 30_000,
      });

    const result =
      await runner.run(
        "C:\\workspace\\test-app",
        {
          command: "npm.cmd",
          args: ["test"],
        }
      );

    expect(
      runProcessSpy
    ).toHaveBeenCalledWith(
      "npm.cmd",
      ["test"],
      {
        cwd:
          "C:\\workspace\\test-app",
        timeoutMs: 30_000,
        env: undefined,
      }
    );

    expect(result).toEqual(
      processResult
    );

    runProcessSpy.mockRestore();
  });

  it("should pass environment variables to the process", async () => {
    const processResult = {
      command: "npm.cmd",
      args: ["run", "test"],
      exitCode: 0,
      stdout: "passed",
      stderr: "",
      timedOut: false,
      durationMs: 5,
    };

    const runProcessSpy =
      vi.spyOn(
        processRunner,
        "runProcess"
      ).mockResolvedValue(
        processResult
      );

    const env = {
      TEST_MODE: "true",
    };

    const runner =
      createTestRunner({
        timeoutMs: 10_000,
        env,
      });

    await runner.run(
      "C:\\workspace\\app",
      {
        command: "npm.cmd",
        args: [
          "run",
          "test",
        ],
      }
    );

    expect(
      runProcessSpy
    ).toHaveBeenCalledWith(
      "npm.cmd",
      [
        "run",
        "test",
      ],
      {
        cwd:
          "C:\\workspace\\app",
        timeoutMs: 10_000,
        env,
      }
    );

    runProcessSpy.mockRestore();
  });
});
