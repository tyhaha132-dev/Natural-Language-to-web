import {
  pipelineLogger,
} from "../logging/pipeline-logger.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineObserver,
} from "./pipeline-observer.js";

export function createPipelineLoggerObserver(): PipelineObserver {
  return {
    onStart(
      context: PipelineExecutionContext
    ): void {
      pipelineLogger.start(
        context.request.id
      );
    },

    onStateChange(
      previousState: string,
      context: PipelineExecutionContext
    ): void {
      pipelineLogger.stateChange(
        context.request.id,
        previousState,
        context.state
      );
    },

    onComplete(
      context: PipelineExecutionContext
    ): void {
      pipelineLogger.complete(
        context.request.id
      );
    },

    onFailure(
      error: unknown,
      context: PipelineExecutionContext
    ): void {
      const reason =
        error instanceof Error
          ? error.message
          : String(error);

      pipelineLogger.failed(
        context.request.id,
        reason
      );
    },
  };
}
