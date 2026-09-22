import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

export interface PipelineObserver {
  onStart(
    context: PipelineExecutionContext
  ): void;

  onStateChange(
    previousState: string,
    context: PipelineExecutionContext
  ): void;

  onComplete(
    context: PipelineExecutionContext
  ): void;

  onFailure(
    error: unknown,
    context: PipelineExecutionContext
  ): void;
}

export const NOOP_PIPELINE_OBSERVER: PipelineObserver = {
  onStart(): void {},

  onStateChange(): void {},

  onComplete(): void {},

  onFailure(): void {},
};
