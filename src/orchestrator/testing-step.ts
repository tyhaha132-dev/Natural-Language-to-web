import type {
  TestPlan,
} from "../testing/test-plan.js";

import type {
  TestingService,
} from "../testing/testing-service.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export interface TestingStepOptions {
  testingService: TestingService;
  testPlan: TestPlan;
}

export class TestingStep
  implements PipelineStep
{
  readonly name = "run-tests";

  private readonly testingService:
    TestingService;

  private readonly testPlan:
    TestPlan;

  constructor(
    options: TestingStepOptions
  ) {
    this.testingService =
      options.testingService;

    this.testPlan =
      options.testPlan;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    if (context.workspace === null) {
      throw new Error(
        "TestingStep requires a workspace"
      );
    }

    const result =
      await this.testingService.run(
        context.workspace,
        this.testPlan.commands
      );

    if (result.status !== "PASSED") {
      return {
        ...context,
        testResult: result,
        updatedAt:
          new Date().toISOString(),
      };
    }

    return {
      ...context,
      testResult: result,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
