import {
  runProcess,
} from "../runtime/process-runner.js";

import type {
  ProcessResult,
} from "../runtime/process-result.js";

import type {
  TestCommand,
} from "./test-plan.js";

export interface TestRunnerOptions {
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export interface TestRunner {
  run(
    workspace: string,
    testCommand: TestCommand
  ): Promise<ProcessResult>;
}

export function createTestRunner(
  options: TestRunnerOptions = {}
): TestRunner {
  return {
    async run(
      workspace: string,
      testCommand: TestCommand
    ): Promise<ProcessResult> {
      return runProcess(
        testCommand.command,
        testCommand.args,
        {
          cwd: workspace,
          timeoutMs:
            options.timeoutMs,
          env:
            options.env,
        }
      );
    },
  };
}
