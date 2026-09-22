import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  PipelineObserver,
} from "../src/orchestrator/pipeline-observer.js";

import {
  NOOP_PIPELINE_OBSERVER,
} from "../src/orchestrator/pipeline-observer.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("PipelineObserver", () => {
  it("should support all pipeline lifecycle callbacks", () => {
    const events: string[] = [];

    const observer: PipelineObserver = {
      onStart() {
        events.push("start");
      },

      onStateChange(
        previousState,
        context
      ) {
        events.push(
          `state:${previousState}->${context.state}`
        );
      },

      onComplete() {
        events.push("complete");
      },

      onFailure(error) {
        events.push(
          `failure:${error instanceof Error ? error.message : String(error)}`
        );
      },
    };

    const context =
      createPipelineExecutionContext({
        id: "observer-test-1",
        prompt: "Build an app",
      });

    observer.onStart(context);

    observer.onStateChange(
      "STARTING",
      {
        ...context,
        state: "ANALYZING",
      }
    );

    observer.onComplete({
      ...context,
      state: "DECIDING",
    });

    observer.onFailure(
      new Error("Pipeline failed"),
      {
        ...context,
        state: "FAILED",
        failureReason: "Pipeline failed",
      }
    );

    expect(events).toEqual([
      "start",
      "state:STARTING->ANALYZING",
      "complete",
      "failure:Pipeline failed",
    ]);
  });

  it("should provide a no-op observer", () => {
    const context =
      createPipelineExecutionContext({
        id: "observer-test-2",
        prompt: "Build an app",
      });

    expect(() => {
      NOOP_PIPELINE_OBSERVER.onStart(
        context
      );

      NOOP_PIPELINE_OBSERVER.onStateChange(
        "STARTING",
        context
      );

      NOOP_PIPELINE_OBSERVER.onComplete(
        context
      );

      NOOP_PIPELINE_OBSERVER.onFailure(
        new Error("test"),
        context
      );
    }).not.toThrow();
  });
});
