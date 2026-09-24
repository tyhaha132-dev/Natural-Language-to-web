import type {
  ApplicationTestingService,
} from "../testing/application-testing-service.js";

import type {
  TestPlan,
} from "../testing/test-plan.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

import type {
  TestResult,
} from "../testing/test-result.js";

export interface ApplicationTestingStepOptions {
  readonly applicationTestingService:
    ApplicationTestingService;

  readonly testPlan:
    TestPlan;
}

export class ApplicationTestingStep
  implements PipelineStep
{
  readonly name =
    "run-tests";

  private readonly applicationTestingService:
    ApplicationTestingService;

  private readonly testPlan:
    TestPlan;

  constructor(
    options: ApplicationTestingStepOptions
  ) {
    this.applicationTestingService =
      options.applicationTestingService;

    this.testPlan =
      options.testPlan;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    if (context.workspace === null) {
      throw new Error(
        "ApplicationTestingStep requires a workspace"
      );
    }

    const result =
      await this.applicationTestingService.run(
        context.workspace,
        this.testPlan.commands
      );

    const testResult =
      this.toTestResult(result);

    return {
      ...context,

      testResult: {
        status:
          result.status,

        results: [
          testResult,
        ],
      },

      updatedAt:
        new Date().toISOString(),
    };
  }

  private toTestResult(
    result: Awaited<
      ReturnType<
        ApplicationTestingService["run"]
      >
    >
  ): TestResult {
    const passed =
      result.status === "PASSED";

    return {
      status:
        passed
          ? "PASSED"
          : "FAILED",

      command:
        "application-test",

      args: [
        result.url,
      ],

      exitCode:
        passed
          ? 0
          : 1,

      stdout:
        passed
          ? [
              "Application test passed.",
              `Runtime: ${result.runtime}`,
              `URL: ${result.url}`,
            ].join("\n")
          : "",

      stderr:
        passed
          ? ""
          : [
              "Application test failed.",
              `Runtime: ${result.runtime}`,
              `URL: ${result.url}`,
              `Error: ${
                result.error ??
                "Unknown application test error"
              }`,
            ].join("\n"),

      durationMs: 0,
    };
  }
}
