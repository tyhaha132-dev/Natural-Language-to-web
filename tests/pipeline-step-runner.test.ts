import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

import {
  createPipelineStepRunner,
} from "../src/orchestrator/pipeline-step-runner.js";

import type {
  PipelineStep,
} from "../src/orchestrator/pipeline-step.js";

describe("PipelineStepRunner", () => {
  it("should execute a pipeline step", async () => {
    const runner =
      createPipelineStepRunner();

    const context =
      createPipelineExecutionContext({
        id: "runner-test-1",
        prompt: "Build an app",
      });

    const step: PipelineStep = {
      name: "test-step",

      async execute(input) {
        return {
          ...input,
          iteration: 1,
        };
      },
    };

    const result =
      await runner.run(
        step,
        context
      );

    expect(result.iteration).toBe(1);
    expect(result.request).toEqual(
      context.request
    );
  });

  it("should call observer callbacks in order", async () => {
    const events: string[] = [];

    const runner =
      createPipelineStepRunner({
        observer: {
          onStart(step) {
            events.push(
              `start:${step.name}`
            );
          },

          onComplete(step) {
            events.push(
              `complete:${step.name}`
            );
          },

          onFailure() {
            events.push("failure");
          },
        },
      });

    const context =
      createPipelineExecutionContext({
        id: "runner-test-2",
        prompt: "Build an app",
      });

    const step: PipelineStep = {
      name: "observed-step",

      async execute(input) {
        events.push("execute");

        return input;
      },
    };

    await runner.run(
      step,
      context
    );

    expect(events).toEqual([
      "start:observed-step",
      "execute",
      "complete:observed-step",
    ]);
  });

  it("should call onFailure and propagate the error", async () => {
    const events: string[] = [];

    const runner =
      createPipelineStepRunner({
        observer: {
          onStart() {
            events.push("start");
          },

          onComplete() {
            events.push("complete");
          },

          onFailure(step, error) {
            events.push(
              `failure:${step.name}:${error instanceof Error ? error.message : String(error)}`
            );
          },
        },
      });

    const context =
      createPipelineExecutionContext({
        id: "runner-test-3",
        prompt: "Build an app",
      });

    const step: PipelineStep = {
      name: "failing-step",

      async execute() {
        throw new Error(
          "Step execution failed"
        );
      },
    };

    await expect(
      runner.run(
        step,
        context
      )
    ).rejects.toThrow(
      "Step execution failed"
    );

    expect(events).toEqual([
      "start",
      "failure:failing-step:Step execution failed",
    ]);
  });
});
