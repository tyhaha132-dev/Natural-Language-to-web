import type {
  PipelineContext,
  PipelineRequest,
  PipelineState,
} from "../contracts/pipeline.js";

import type {
  PlanResult,
} from "./plan-result.js";

import type {
  CodingResult,
} from "./coding-result.js";

import type {
  DatabaseResult,
} from "./database-result.js";

import type {
  TestingServiceResult,
} from "../testing/testing-service.js";

import type {
  ReviewResult,
} from "./review-result.js";

import type {
  DecisionResult,
} from "./decision-result.js";

export interface PipelineExecutionContext
  extends PipelineContext {
  workspace: string | null;
  analysis: unknown | null;
  plan: PlanResult | null;
  codingResult: CodingResult | null;
  databaseResult: DatabaseResult | null;
  testResult: TestingServiceResult | null;
  reviewResult: ReviewResult | null;
  decisionResult: DecisionResult | null;
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
    codingResult: null,
    databaseResult: null,
    testResult: null,
    reviewResult: null,
    decisionResult: null,
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
