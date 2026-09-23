import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createTestingService,
} from "../src/testing/testing-service.js";

import type {
  TestRunner,
} from "../src/testing/test-runner.js";

describe("TestingService", () => {
  it("should run all commands when every command passes", async () => {
    const runner: TestRunner = {
      run: vi
        .fn()
        .mockResolvedValueOnce({
          command: "npm.cmd",
          args: ["run", "typecheck"],
          exitCode: 0,
          stdout: "typecheck passed",
          stderr: "",
          timedOut: false,
          durationMs: 10,
        })
        .mockResolvedValueOnce({
          command: "npm.cmd",
          args: ["test"],
          exitCode: 0,
          stdout: "tests passed",
          stderr: "",
          timedOut: false,
          durationMs: 20,
        }),
    };

    const service =
      createTestingService(
        runner
      );

    const result =
      await service.run(
        "C:\\workspace\\app",
        [
          {
            command: "npm.cmd",
            args: [
              "run",
              "typecheck",
            ],
          },
          {
            command: "npm.cmd",
            args: ["test"],
          },
        ]
      );

    expect(result.status).toBe(
      "PASSED"
    );

    expect(
      result.results
    ).toHaveLength(2);

    expect(runner.run).toHaveBeenCalledTimes(
      2
    );
  });

  it("should stop after the first failed command", async () => {
    const runner: TestRunner = {
      run: vi
        .fn()
        .mockResolvedValueOnce({
          command: "npm.cmd",
          args: ["run", "typecheck"],
          exitCode: 0,
          stdout: "passed",
          stderr: "",
          timedOut: false,
          durationMs: 10,
        })
        .mockResolvedValueOnce({
          command: "npm.cmd",
          args: ["test"],
          exitCode: 1,
          stdout: "",
          stderr: "test failed",
          timedOut: false,
          durationMs: 20,
        }),
    };

    const service =
      createTestingService(
        runner
      );

    const result =
      await service.run(
        "C:\\workspace\\app",
        [
          {
            command: "npm.cmd",
            args: [
              "run",
              "typecheck",
            ],
          },
          {
            command: "npm.cmd",
            args: ["test"],
          },
          {
            command: "npm.cmd",
            args: ["run", "build"],
          },
        ]
      );

    expect(result.status).toBe(
      "FAILED"
    );

    expect(
      result.results
    ).toHaveLength(2);

    expect(runner.run).toHaveBeenCalledTimes(
      2
    );

    expect(
      runner.run
    ).not.toHaveBeenCalledWith(
      "C:\\workspace\\app",
      {
        command: "npm.cmd",
        args: [
          "run",
          "build",
        ],
      }
    );
  });

  it("should fail when a command times out", async () => {
    const runner: TestRunner = {
      run: vi
        .fn()
        .mockResolvedValue({
          command: "npm.cmd",
          args: ["test"],
          exitCode: null,
          stdout: "",
          stderr: "",
          timedOut: true,
          durationMs: 30_000,
        }),
    };

    const service =
      createTestingService(
        runner
      );

    const result =
      await service.run(
        "C:\\workspace\\app",
        [
          {
            command: "npm.cmd",
            args: ["test"],
          },
        ]
      );

    expect(result.status).toBe(
      "FAILED"
    );

    expect(
      result.results[0]?.status
    ).toBe("TIMED_OUT");
  });
});
