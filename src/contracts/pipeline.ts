export type PipelineState =
  | "STARTING"
  | "ANALYZING"
  | "PLANNING"
  | "PLAN_VALIDATING"
  | "ENVIRONMENT_SETUP"
  | "CODING"
  | "DATABASE_SETUP"
  | "TESTING"
  | "REVIEWING"
  | "DECIDING"
  | "COMPLETED"
  | "FAILED";

export interface PipelineRequest {
  id: string;
  prompt: string;
}

export interface PipelineContext {
  request: PipelineRequest;
  state: PipelineState;
  iteration: number;
  createdAt: string;
  updatedAt: string;
}
