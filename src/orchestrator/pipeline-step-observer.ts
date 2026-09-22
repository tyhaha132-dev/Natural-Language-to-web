import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export interface PipelineStepObserver {
  onStart(
    step: PipelineStep,
    context: PipelineExecutionContext
  ): void;

  onComplete(
    step: PipelineStep,
    context: PipelineExecutionContext
  ): void;

  onFailure(
    step: PipelineStep,
    error: unknown,
    context: PipelineExecutionContext
  ): void;
}

export const NOOP_PIPELINE_STEP_OBSERVER: PipelineStepObserver = {
  onStart(): void {},
  onComplete(): void {},
  onFailure(): void {},
};
