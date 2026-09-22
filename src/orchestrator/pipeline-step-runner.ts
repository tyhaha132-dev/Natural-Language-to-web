import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import {
  NOOP_PIPELINE_STEP_OBSERVER,
  type PipelineStepObserver,
} from "./pipeline-step-observer.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export interface PipelineStepRunner {
  run(
    step: PipelineStep,
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext>;
}

export interface PipelineStepRunnerOptions {
  observer?: PipelineStepObserver;
}

export function createPipelineStepRunner(
  options: PipelineStepRunnerOptions = {}
): PipelineStepRunner {
  const observer =
    options.observer ??
    NOOP_PIPELINE_STEP_OBSERVER;

  return {
    async run(
      step: PipelineStep,
      context: PipelineExecutionContext
    ): Promise<PipelineExecutionContext> {
      observer.onStart(
        step,
        context
      );

      try {
        const result =
          await step.execute(context);

        observer.onComplete(
          step,
          result
        );

        return result;
      } catch (error) {
        observer.onFailure(
          step,
          error,
          context
        );

        throw error;
      }
    },
  };
}
