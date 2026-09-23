import type {
  PipelineState,
} from "../contracts/pipeline.js";

import {
  changePipelineState,
} from "./pipeline-context.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export class StateTransitionStep
  implements PipelineStep
{
  readonly name: string;
  private readonly nextState:
    PipelineState;

  constructor(
    name: string,
    nextState: PipelineState
  ) {
    this.name = name;
    this.nextState = nextState;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    const transitioned =
      changePipelineState(
        context,
        this.nextState
      );

    return {
      ...transitioned,
      workspace: context.workspace,
      analysis: context.analysis,
      plan: context.plan,
      codingResult:
        context.codingResult,
      databaseResult:
        context.databaseResult,
      testResult:
        context.testResult,
      reviewResult:
        context.reviewResult,
      decisionResult:
        context.decisionResult,
      failureReason:
        context.failureReason,
    };
  }
}
