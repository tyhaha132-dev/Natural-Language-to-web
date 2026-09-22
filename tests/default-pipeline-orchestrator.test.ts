import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DefaultPipelineOrchestrator,
} from "../src/orchestrator/default-pipeline-orchestrator.js";

import type {
  PipelineStep,
} from "../src/orchestrator/pipeline-step.js";

describe("DefaultPipelineOrchestrator", () => {
  it("should execute the default pipeline state flow", async () => {
    const orchestrator =
      new DefaultPipelineOrchestrator();

    const result =
      await orchestrator.execute({
        id: "pipeline-1",
        prompt: "Build a student app",
      });

    expect(result.status).toBe(
      "COMPLETED"
    );

    expect(result.context.request.id).toBe(
      "pipeline-1"
    );

    expect(
      result.context.request.prompt
    ).toBe(
      "Build a student app"
    );

    expect(result.context.state).toBe(
      "DECIDING"
    );

    expect(result.context.iteration).toBe(
      0
    );

    expect(
      result.context.workspace
    ).toBeNull();

    expect(
      result.context.failureReason
    ).toBeNull();

    expect(result.durationMs).toBeGreaterThanOrEqual(
      0
    );
  });

  it("should execute custom steps in order", async () => {
    const executionOrder: string[] = [];

    const step1: PipelineStep = {
      name: "step-1",

      async execute(context) {
        executionOrder.push("step-1");

        return {
          ...context,
          iteration: 1,
        };
      },
    };

    const step2: PipelineStep = {
      name: "step-2",

      async execute(context) {
        executionOrder.push("step-2");

        return {
          ...context,
          iteration:
            context.iteration + 1,
        };
      },
    };

    const step3: PipelineStep = {
      name: "step-3",

      async execute(context) {
        executionOrder.push("step-3");

        return {
          ...context,
          iteration:
            context.iteration + 1,
        };
      },
    };

    const orchestrator =
      new DefaultPipelineOrchestrator({
        steps: [
          step1,
          step2,
          step3,
        ],
      });

    const result =
      await orchestrator.execute({
        id: "pipeline-2",
        prompt: "Build an app",
      });

    expect(result.status).toBe(
      "COMPLETED"
    );

    expect(executionOrder).toEqual([
      "step-1",
      "step-2",
      "step-3",
    ]);

    expect(result.context.iteration).toBe(
      3
    );
  });

  it("should return a failed result when a step fails", async () => {
    const failingStep: PipelineStep = {
      name: "failing-step",

      async execute() {
        throw new Error(
          "Pipeline step failed"
        );
      },
    };

    const orchestrator =
      new DefaultPipelineOrchestrator({
        steps: [failingStep],
      });

    const result =
      await orchestrator.execute({
        id: "pipeline-3",
        prompt: "Build an app",
      });

    expect(result.status).toBe(
      "FAILED"
    );

    expect(result.context.state).toBe(
      "FAILED"
    );

    expect(
      result.context.failureReason
    ).toBe(
      "Pipeline step failed"
    );
  });

  it("should observe the complete default state flow", async () => {
    const events: string[] = [];

    const orchestrator =
      new DefaultPipelineOrchestrator({
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

    const result =
      await orchestrator.execute({
        id: "pipeline-4",
        prompt: "Build an app",
      });

    expect(result.status).toBe(
      "COMPLETED"
    );

    expect(result.context.state).toBe(
      "DECIDING"
    );

    expect(events).toHaveLength(20);

    expect(events[0]).toBe(
      "start:STARTING -> ANALYZING"
    );

    expect(events[1]).toBe(
      "complete:STARTING -> ANALYZING"
    );

    expect(events[18]).toBe("start:REVIEWING -> DECIDING");

    expect(events[19]).toBe("complete:REVIEWING -> DECIDING");
  });

  it("should notify the pipeline observer about lifecycle events", async () => {
    const events: string[] = [];

    const orchestrator =
      new DefaultPipelineOrchestrator({
        pipelineObserver: {
          onStart(context) {
            events.push(
              `start:${context.state}`
            );
          },

          onStateChange(
            previousState,
            context
          ) {
            events.push(
              `state:${previousState}->${context.state}`
            );
          },

          onComplete(context) {
            events.push(
              `complete:${context.state}`
            );
          },

          onFailure() {
            events.push("failure");
          },
        },
      });

    const result =
      await orchestrator.execute({
        id: "pipeline-5",
        prompt: "Build an app",
      });

    expect(result.status).toBe(
      "COMPLETED"
    );

    expect(events[0]).toBe(
      "start:STARTING"
    );

    expect(events[1]).toBe(
      "state:STARTING->ANALYZING"
    );

    expect(events).toContain(
      "state:REVIEWING->DECIDING"
    );

    expect(events[events.length - 1]).toBe(
      "complete:DECIDING"
    );

    expect(
      events.filter((event) =>
        event.startsWith("state:")
      )
    ).toHaveLength(9);
  });

  it("should notify the pipeline observer on failure", async () => {
    const events: string[] = [];

    const failingStep: PipelineStep = {
      name: "failing-step",

      async execute() {
        throw new Error(
          "Pipeline step failed"
        );
      },
    };

    const orchestrator =
      new DefaultPipelineOrchestrator({
        steps: [failingStep],

        pipelineObserver: {
          onStart(context) {
            events.push(
              `start:${context.state}`
            );
          },

          onStateChange() {
            events.push("state-change");
          },

          onComplete() {
            events.push("complete");
          },

          onFailure(error, context) {
            events.push(
              `failure:${context.state}:${error instanceof Error ? error.message : String(error)}`
            );
          },
        },
      });

    const result =
      await orchestrator.execute({
        id: "pipeline-6",
        prompt: "Build an app",
      });

    expect(result.status).toBe(
      "FAILED"
    );

    expect(events).toEqual([
      "start:STARTING",
      "failure:FAILED:Pipeline step failed",
    ]);
  });
});

