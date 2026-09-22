import type {
  PipelineContext,
  PipelineRequest,
  PipelineState,
} from "../contracts/pipeline.js";
import { transition } from "./state-machine.js";

export function createPipelineContext(
  request: PipelineRequest
): PipelineContext {
  const now = new Date().toISOString();

  return {
    request,
    state: "STARTING",
    iteration: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function changePipelineState(
  context: PipelineContext,
  nextState: PipelineState
): PipelineContext {
  const state = transition(context.state, nextState);

  return {
    ...context,
    state,
    updatedAt: new Date().toISOString(),
  };
}

export function incrementIteration(
  context: PipelineContext
): PipelineContext {
  return {
    ...context,
    iteration: context.iteration + 1,
    updatedAt: new Date().toISOString(),
  };
}
