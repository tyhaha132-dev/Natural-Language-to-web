import type {
  PipelineState,
} from "../contracts/pipeline.js";

export const PIPELINE_FLOW: readonly PipelineState[] = [
  "STARTING",
  "ANALYZING",
  "PLANNING",
  "PLAN_VALIDATING",
  "ENVIRONMENT_SETUP",
  "CODING",
  "DATABASE_SETUP",
  "TESTING",
  "REVIEWING",
  "DECIDING",
] as const;
