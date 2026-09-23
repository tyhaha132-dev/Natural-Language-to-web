import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

import type {
  DecisionEngine,
} from "./decision-engine.js";

export interface DecisionStepOptions {
  decisionEngine: DecisionEngine;
}

export class DecisionStep
  implements PipelineStep
{
  readonly name = "decision";

  private readonly decisionEngine:
    DecisionEngine;

  constructor(
    options: DecisionStepOptions
  ) {
    this.decisionEngine =
      options.decisionEngine;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    const decisionResult =
      this.decisionEngine.decide(
        context
      );

    return {
      ...context,
      decisionResult,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
