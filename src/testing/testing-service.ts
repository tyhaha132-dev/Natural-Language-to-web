import type {
  TestRunner,
} from "./test-runner.js";

import {
  createTestResult,
} from "./test-result.js";

import type {
  TestResult,
} from "./test-result.js";

export interface TestingServiceResult {
  status: "PASSED" | "FAILED";
  results: readonly TestResult[];
}

export interface TestingService {
  run(
    workspace: string,
    commands: readonly {
      command: string;
      args: readonly string[];
    }[]
  ): Promise<TestingServiceResult>;
}

export function createTestingService(
  testRunner: TestRunner
): TestingService {
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
  };
}
