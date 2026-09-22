import {
  describe,
  expect,
  it,
} from "vitest";

import {
  NOOP_PIPELINE_STEP_OBSERVER,
  type PipelineStepObserver,
} from "../src/orchestrator/pipeline-step-observer.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

import type {
  PipelineStep,
} from "../src/orchestrator/pipeline-step.js";

const step: PipelineStep = {
  name: "test-step",

  async execute(context) {
    return context;
  },
};

describe("PipelineStepObserver", () => {
  it("should expose the required observer methods", () => {
    const observer: PipelineStepObserver =
      NOOP_PIPELINE_STEP_OBSERVER;

    expect(
      typeof observer.onStart
    ).toBe("function");

    expect(
      typeof observer.onComplete
    ).toBe("function");

    expect(
      typeof observer.onFailure
    ).toBe("function");
  });

  it("should allow observer callbacks", () => {
    const events: string[] = [];

    const observer: PipelineStepObserver = {
      onStart() {
        events.push("start");
      },

      onComplete() {
        events.push("complete");
      },

      onFailure() {
        events.push("failure");
      },
    };

    const context =
      createPipelineExecutionContext({
        id: "observer-test",
        prompt: "Build an app",
      });

    observer.onStart(
      step,
      context
    );

    observer.onComplete(
      step,
      context
    );

    observer.onFailure(
      step,
      new Error("test"),
      context
    );

    expect(events).toEqual([
      "start",
      "complete",
      "failure",
    ]);
  });
});
