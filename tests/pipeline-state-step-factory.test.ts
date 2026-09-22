import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPipelineStateSteps,
} from "../src/orchestrator/pipeline-state-step-factory.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("PipelineStateStepFactory", () => {
  it("should create state transition steps plus the analysis step", () => {
    const steps =
      createPipelineStateSteps();

    expect(steps).toHaveLength(10);

    expect(steps[0].name).toBe(
      "STARTING -> ANALYZING"
    );

    expect(steps[1].name).toBe(
      "analyze-request"
    );

    expect(steps[2].name).toBe(
      "ANALYZING -> PLANNING"
    );
  });

  it("should execute the complete state flow", async () => {
    const steps =
      createPipelineStateSteps();

    let context =
      createPipelineExecutionContext({
        id: "factory-test-1",
        prompt: "Build an app",
      });

    for (const step of steps) {
      context =
        await step.execute(context);
    }

    expect(context.state).toBe(
      "DECIDING"
    );

    expect(context.analysis).not.toBeNull();
  });

  it("should preserve pipeline request", async () => {
    const steps =
      createPipelineStateSteps();

    let context =
      createPipelineExecutionContext({
        id: "factory-test-2",
        prompt: "Build a student app",
      });

    for (const step of steps) {
      context =
        await step.execute(context);
    }

    expect(
      context.request.id
    ).toBe(
      "factory-test-2"
    );

    expect(
      context.request.prompt
    ).toBe(
      "Build a student app"
    );

    expect(context.analysis).toEqual(
      expect.objectContaining({
        projectType: "web-app",
        prompt: "Build a student app",
      })
    );
  });
});
