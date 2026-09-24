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

      console.log(
        "[APP_TEST_DEBUG] run started"
      );

      try {
        console.log(
          "[APP_TEST_DEBUG] calling server.start()"
        );

        await server.start();

        applicationStarted = true;

        console.log(
          `[APP_TEST_DEBUG] server started: ${server.baseUrl}`
        );

        const results = [];

        for (const command of commands) {
          console.log(
            `[APP_TEST_DEBUG] running command: ${command.command} ${command.args.join(" ")}`
          );

          const processResult =
            await options.testRunner.run(
              workspace,
              command
            );

          console.log(
            `[APP_TEST_DEBUG] command returned: exitCode=${processResult.exitCode}, timedOut=${processResult.timedOut}`
          );

          const testResult =
            createTestResult(
              processResult
            );

          results.push(testResult);

          console.log(
            `[APP_TEST_DEBUG] test result: ${testResult.status}`
          );

          if (
            testResult.status !==
            "PASSED"
          ) {
            console.log(
              "[APP_TEST_DEBUG] test failed, returning FAILED"
            );

            return {
              status: "FAILED",
              results,
              applicationStarted,
            };
          }
        }

        console.log(
          "[APP_TEST_DEBUG] all test commands passed"
        );

        return {
          status: "PASSED",
          results,
          applicationStarted,
        };
      } finally {
        if (applicationStarted) {
          console.log(
            "[APP_TEST_DEBUG] calling server.stop()"
          );

          await server.stop();

          console.log(
            "[APP_TEST_DEBUG] server stopped"
          );
        }
      }
    },
  };
}
