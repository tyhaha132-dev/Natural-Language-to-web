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
  ApplicationTestRunner,
  ApplicationTestRunnerResult,
} from "./application-test-runner.js";

export interface ApplicationTestRunnerOptions {
  readonly testRunner: TestRunner;
}

export function createApplicationTestRunner(
  options: ApplicationTestRunnerOptions
): ApplicationTestRunner {
  return {
    async run(
      server: ApplicationServer,
      workspace: string,
      commands: readonly TestCommand[]
    ): Promise<ApplicationTestRunnerResult> {
      let applicationStarted = false;

      try {
        await server.start();

        applicationStarted = true;

        const results = [];

        for (const command of commands) {
          const processResult =
            await options.testRunner.run(
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
              applicationStarted,
            };
          }
        }

        return {
          status: "PASSED",
          results,
          applicationStarted,
        };
      } finally {
        if (applicationStarted) {
          await server.stop();
        }
      }
    },
  };
}
