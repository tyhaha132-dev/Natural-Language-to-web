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
  it("should create one step for each state transition", () => {
    const steps =
      createPipelineStateSteps();

    expect(steps).toHaveLength(9);

    expect(
      steps.map(
        (step) => step.name
      )
    ).toEqual([
      "STARTING -> ANALYZING",
      "ANALYZING -> PLANNING",
      "PLANNING -> PLAN_VALIDATING",
      "PLAN_VALIDATING -> ENVIRONMENT_SETUP",
      "ENVIRONMENT_SETUP -> CODING",
      "CODING -> DATABASE_SETUP",
      "DATABASE_SETUP -> TESTING",
      "TESTING -> REVIEWING",
      "REVIEWING -> DECIDING",
    ]);
  });

  it("should execute the complete state flow", async () => {
    const steps =
      createPipelineStateSteps();

    let context =
      createPipelineExecutionContext({
        id: "state-flow-test",
        prompt: "Build an app",
      });

    for (const step of steps) {
      context =
        await step.execute(context);
    }

    expect(context.state).toBe(
      "DECIDING"
    );
  });

  it("should preserve pipeline request", async () => {
    const steps =
      createPipelineStateSteps();

    let context =
      createPipelineExecutionContext({
        id: "state-flow-request-test",
        prompt: "Build a student app",
      });

    for (const step of steps) {
      context =
        await step.execute(context);
    }

    expect(context.request).toEqual({
      id: "state-flow-request-test",
      prompt: "Build a student app",
    });
  });
});
