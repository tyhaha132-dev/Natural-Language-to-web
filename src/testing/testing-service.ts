import type {
  ApplicationServer,
} from "../runtime/application-server.js";

import type {
  TestCommand,
} from "./test-plan.js";

import type {
  TestRunner,
} from "./test-runner.js";

import {
  createTestResult,
} from "./test-result.js";

import type {
  TestResult,
} from "./test-result.js";

import type {
  ApplicationTestRunner,
} from "./application-test-runner.js";

export interface TestingServiceResult {
  status: "PASSED" | "FAILED";
  results: readonly TestResult[];
}

export interface TestingService {
  /**
   * Legacy test mode.
   *
   * Runs test commands directly in the workspace.
   */
  run(
    workspace: string,
    commands: readonly TestCommand[]
  ): Promise<TestingServiceResult>;

  /**
   * Application test mode.
   *
   * Optional so existing pipeline/test doubles remain compatible.
   */
  runApplication?(
    workspace: string,
    server: ApplicationServer,
    commands: readonly TestCommand[]
  ): Promise<TestingServiceResult>;
}

export interface TestingServiceOptions {
  readonly testRunner: TestRunner;
  readonly applicationTestRunner?: ApplicationTestRunner;
}

export function createTestingService(
  testRunnerOrOptions:
    | TestRunner
    | TestingServiceOptions
): TestingService {
  const testRunner =
    "testRunner" in testRunnerOrOptions
      ? testRunnerOrOptions.testRunner
      : testRunnerOrOptions;

  const applicationTestRunner =
    "testRunner" in testRunnerOrOptions
      ? testRunnerOrOptions.applicationTestRunner
      : undefined;

  return {
    async run(
      workspace,
      commands
    ): Promise<TestingServiceResult> {
      const results: TestResult[] = [];

      for (const command of commands) {
        const processResult =
          await testRunner.run(
            workspace,
            command
          );

        const testResult =
          createTestResult(
            processResult
          );

        results.push(testResult);

        if (
          testResult.status !==
          "PASSED"
        ) {
          return {
            status: "FAILED",
            results,
          };
        }
      }

      return {
        status: "PASSED",
        results,
      };
    },

    async runApplication(
      workspace,
      server,
      commands
    ): Promise<TestingServiceResult> {
      if (
        applicationTestRunner ===
        undefined
      ) {
        throw new Error(
          "ApplicationTestRunner is not configured."
        );
      }

      const result =
        await applicationTestRunner.run(
          server,
          workspace,
          commands
        );

      return {
        status: result.status,
        results: result.results,
      };
    },
  };
}
