import {
  PIPELINE_FLOW,
} from "./pipeline-flow.js";

import {
  StateTransitionStep,
} from "./state-transition-step.js";

import {
  AnalysisStep,
} from "./analysis-step.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export function createPipelineStateSteps(): PipelineStep[] {
  const steps: PipelineStep[] = [];

  for (
    let index = 1;
    index < PIPELINE_FLOW.length;
    index += 1
  ) {
    const previousState =
      PIPELINE_FLOW[index - 1];

    const nextState =
      PIPELINE_FLOW[index];

    steps.push(
      new StateTransitionStep(
        `${previousState} -> ${nextState}`,
        nextState
      )
    );

    if (
      previousState === "STARTING" &&
      nextState === "ANALYZING"
    ) {
      steps.push(
        new AnalysisStep()
      );
    }
  }

  return steps;
}
