import type { PipelineState } from "../contracts/pipeline.js";

const TRANSITIONS: Record<PipelineState, readonly PipelineState[]> = {
  STARTING: ["ANALYZING", "FAILED"],
  ANALYZING: ["PLANNING", "FAILED"],
  PLANNING: ["PLAN_VALIDATING", "FAILED"],
  PLAN_VALIDATING: ["ENVIRONMENT_SETUP", "FAILED"],
  ENVIRONMENT_SETUP: ["CODING", "FAILED"],
  CODING: ["DATABASE_SETUP", "TESTING", "FAILED"],
  DATABASE_SETUP: ["TESTING", "FAILED"],
  TESTING: ["CODING", "REVIEWING", "FAILED"],
  REVIEWING: ["CODING", "DECIDING", "FAILED"],
  DECIDING: ["COMPLETED", "CODING", "FAILED"],
  COMPLETED: [],
  FAILED: [],
};

export function canTransition(
  from: PipelineState,
  to: PipelineState
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transition(
  from: PipelineState,
  to: PipelineState
): PipelineState {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid pipeline transition: ${from} -> ${to}`
    );
  }

  return to;
}

export function getAllowedTransitions(
  state: PipelineState
): readonly PipelineState[] {
  return TRANSITIONS[state];
}
