import type {
  PlanValidator,
} from "../planner/plan-validator.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export class PlanValidationStep
  implements PipelineStep
{
  readonly name = "validate-plan";

  private readonly validator: PlanValidator;

  constructor(
    validator: PlanValidator
  ) {
    this.validator = validator;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    if (context.plan === null) {
      throw new Error(
        "PlanValidationStep requires a plan"
      );
    }

    const result =
      this.validator.validate(
        context.plan
      );

    if (!result.valid) {
      throw new Error(
        `Plan validation failed: ${result.errors.join("; ")}`
      );
    }

    return {
      ...context,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
