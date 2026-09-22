import type {
  PipelineContext,
  PipelineRequest,
  PipelineState,
} from "../contracts/pipeline.js";

export interface PipelineExecutionContext
  extends PipelineContext {
  workspace: string | null;
  analysis: unknown | null;
  plan: unknown | null;
  testResult: unknown | null;
  reviewResult: unknown | null;
  failureReason: string | null;
}

export function createPipelineExecutionContext(
  request: PipelineRequest
): PipelineExecutionContext {
  const now = new Date().toISOString();

  return {
    request,
    state: "STARTING",
    iteration: 0,
    createdAt: now,
    updatedAt: now,
    workspace: null,
    analysis: null,
    plan: null,
    testResult: null,
    reviewResult: null,
    failureReason: null,
  };
}

export function updateExecutionState(
  context: PipelineExecutionContext,
  state: PipelineState
): PipelineExecutionContext {
  return {
    ...context,
    state,
    updatedAt: new Date().toISOString(),
  };
}

export function setWorkspace(
  context: PipelineExecutionContext,
  workspace: string
): PipelineExecutionContext {
  return {
    ...context,
    workspace,
    updatedAt: new Date().toISOString(),
  };
}

export function setFailure(
  context: PipelineExecutionContext,
  failureReason: string
): PipelineExecutionContext {
  return {
    ...context,
    state: "FAILED",
    failureReason,
    updatedAt: new Date().toISOString(),
  };
}

export function incrementExecutionIteration(
  context: PipelineExecutionContext
): PipelineExecutionContext {
  return {
    ...context,
    iteration: context.iteration + 1,
    updatedAt: new Date().toISOString(),
  };
}
