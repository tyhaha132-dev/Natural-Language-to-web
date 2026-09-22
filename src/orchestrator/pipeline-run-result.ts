import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

export type PipelineRunStatus =
  | "COMPLETED"
  | "FAILED";

export interface PipelineRunResult {
  status: PipelineRunStatus;
  context: PipelineExecutionContext;
  durationMs: number;
}
