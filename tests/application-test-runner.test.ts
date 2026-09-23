import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ApplicationServer,
} from "../src/runtime/application-server.js";

import {
  createApplicationTestRunner,
} from "../src/testing/application-test-runner-impl.js";

import type {
  TestRunner,
} from "../src/testing/test-runner.js";

function createMockServer(
  startImplementation:
    () => Promise<void> = async () => {},
  stopImplementation:
    () => Promise<void> = async () => {}
): ApplicationServer {
  return {
    runtime: {
      type: "STATIC",
      workspace: "test-workspace",
    },

    baseUrl:
      "http://127.0.0.1:43134",

    start:
      vi.fn(startImplementation),

    stop:
      vi.fn(stopImplementation),

    isRunning:
      vi.fn(() => true),
  };
}

function createMockTestRunner(
  exitCode: number
): TestRunner {
  return {
    run: vi.fn(
      async () => ({
        command: "npm.cmd",
        args: ["test"],
        exitCode,
        stdout:
          exitCode === 0
            ? "Tests passed"
            : "Tests failed",
        stderr: "",
        timedOut: false,
        durationMs: 10,
      })
    ),
  };
}

describe(
  "ApplicationTestRunner",
  () => {
    it(
      "starts the application, passes tests, and stops the server",
      async () => {
        const server =
          createMockServer();

        const testRunner =
          createMockTestRunner(0);

        const runner =
          createApplicationTestRunner({
            testRunner,
          });

        const result =
          await runner.run(
            server,
            "test-workspace",
            [
              {
                command: "npm.cmd",
                args: ["test"],
              },
            ]
          );

        expect(
          result.status
        ).toBe("PASSED");

        expect(
          result.applicationStarted
        ).toBe(true);

        expect(
          result.results
        ).toHaveLength(1);

        expect(
          server.start
        ).toHaveBeenCalledTimes(1);

        expect(
          server.stop
        ).toHaveBeenCalledTimes(1);

        expect(
          testRunner.run
        ).toHaveBeenCalledTimes(1);
      }
    );

    it(
      "stops the application when tests fail",
      async () => {
        const server =
          createMockServer();

        const testRunner =
          createMockTestRunner(1);

        const runner =
          createApplicationTestRunner({
            testRunner,
          });

        const result =
          await runner.run(
            server,
            "test-workspace",
            [
              {
                command: "npm.cmd",
                args: ["test"],
              },
            ]
          );

        expect(
          result.status
        ).toBe("FAILED");

        expect(
          result.applicationStarted
        ).toBe(true);

        expect(
          result.results
        ).toHaveLength(1);

        expect(
          server.start
        ).toHaveBeenCalledTimes(1);

        expect(
          server.stop
        ).toHaveBeenCalledTimes(1);
      }
    );

    it(
      "does not run tests when application startup fails",
      async () => {
        const server =
          createMockServer(
            async () => {
              throw new Error(
                "Application failed to start"
              );
            }
          );

        const testRunner =
          createMockTestRunner(0);

        const runner =
          createApplicationTestRunner({
            testRunner,
          });

        await expect(
          runner.run(
            server,
            "test-workspace",
            [
              {
                command: "npm.cmd",
                args: ["test"],
              },
            ]
          )
        ).rejects.toThrow(
          "Application failed to start"
        );

        expect(
          server.start
        ).toHaveBeenCalledTimes(1);

        expect(
          server.stop
        ).not.toHaveBeenCalled();

        expect(
          testRunner.run
        ).not.toHaveBeenCalled();
      }
    );
  }
);
