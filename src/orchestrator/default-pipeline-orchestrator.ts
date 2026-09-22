import type {
  PipelineRequest,
} from "../contracts/pipeline.js";

import {
  createPipelineExecutionContext,
  type PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineOrchestrator,
} from "./pipeline-orchestrator.js";

import {
  createPipelineStepRunner,
  type PipelineStepRunner,
} from "./pipeline-step-runner.js";

import {
  NOOP_PIPELINE_STEP_OBSERVER,
  type PipelineStepObserver,
} from "./pipeline-step-observer.js";

import type {
  PipelineObserver,
} from "./pipeline-observer.js";

import {
  createPipelineLoggerObserver,
} from "./pipeline-logger-observer.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

import {
  createPipelineStateSteps,
} from "./pipeline-state-step-factory.js";

import type {
  PipelineRunResult,
} from "./pipeline-run-result.js";

export interface DefaultPipelineOrchestratorOptions {
  steps?: readonly PipelineStep[];
  stepRunner?: PipelineStepRunner;
  observer?: PipelineStepObserver;
  pipelineObserver?: PipelineObserver;
}

export class DefaultPipelineOrchestrator
  implements PipelineOrchestrator
{
  private readonly steps: readonly PipelineStep[];
  private readonly stepRunner: PipelineStepRunner;
  private readonly pipelineObserver: PipelineObserver;

  constructor(
    options: DefaultPipelineOrchestratorOptions = {}
  ) {
    this.steps =
      options.steps ??
      createPipelineStateSteps();

    this.stepRunner =
      options.stepRunner ??
      createPipelineStepRunner({
        observer:
          options.observer ??
          NOOP_PIPELINE_STEP_OBSERVER,
      });

    this.pipelineObserver =
      options.pipelineObserver ??
      createPipelineLoggerObserver();
  }

  async execute(
    request: PipelineRequest
  ): Promise<PipelineRunResult> {
    const startTime = Date.now();

    let context: PipelineExecutionContext =
      createPipelineExecutionContext(
        request
      );

    this.pipelineObserver.onStart(
      context
    );

    try {
      for (const step of this.steps) {
        const previousState =
          context.state;

        context =
          await this.stepRunner.run(
            step,
            context
          );

        if (
          previousState !== context.state
        ) {
          this.pipelineObserver.onStateChange(
            previousState,
            context
          );
        }
      }

      this.pipelineObserver.onComplete(
        context
      );

      return {
        status: "COMPLETED",
        context,
        durationMs:
          Date.now() - startTime,
      };
    } catch (error) {
      const failureReason =
        error instanceof Error
          ? error.message
          : String(error);

      const failedContext: PipelineExecutionContext = {
        ...context,
        state: "FAILED",
        failureReason,
        updatedAt:
          new Date().toISOString(),
      };

      this.pipelineObserver.onFailure(
        error,
        failedContext
      );

      return {
        status: "FAILED",
        context: failedContext,
        durationMs:
          Date.now() - startTime,
      };
    }
  }
}

