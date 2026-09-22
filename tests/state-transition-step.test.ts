import {
  describe,
  expect,
  it,
} from "vitest";

import {
  StateTransitionStep,
} from "../src/orchestrator/state-transition-step.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

import {
  updateExecutionState,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("StateTransitionStep", () => {
  it("should transition from STARTING to ANALYZING", async () => {
    const step =
      new StateTransitionStep(
        "STARTING -> ANALYZING",
        "ANALYZING"
      );

    const context =
      createPipelineExecutionContext({
        id: "transition-test-1",
        prompt: "Build an app",
      });

    const result =
      await step.execute(context);

    expect(result.state).toBe(
      "ANALYZING"
    );
  });

  it("should preserve execution data during transition", async () => {
    const step =
      new StateTransitionStep(
        "ANALYZING -> PLANNING",
        "PLANNING"
      );

    const initialContext =
      createPipelineExecutionContext({
        id: "transition-test-2",
        prompt: "Build an app",
      });

    const context =
      updateExecutionState(
        initialContext,
        "ANALYZING"
      );

    const enrichedContext = {
      ...context,
      workspace:
        "D:\\workspace\\pipeline-1",
      analysis: {
        projectType: "web-app",
      },
      plan: {
        tasks: ["create frontend"],
      },
      testResult: {
        passed: true,
      },
      reviewResult: {
        approved: true,
      },
      failureReason: null,
    };

    const result =
      await step.execute(
        enrichedContext
      );

    expect(result.state).toBe(
      "PLANNING"
    );

    expect(result.workspace).toBe(
      enrichedContext.workspace
    );

    expect(result.analysis).toEqual(
      enrichedContext.analysis
    );

    expect(result.plan).toEqual(
      enrichedContext.plan
    );

    expect(result.testResult).toEqual(
      enrichedContext.testResult
    );

    expect(result.reviewResult).toEqual(
      enrichedContext.reviewResult
    );

    expect(result.failureReason).toBeNull();
  });

  it("should reject invalid state transitions", async () => {
    const step =
      new StateTransitionStep(
        "STARTING -> COMPLETED",
        "COMPLETED"
      );

    const context =
      createPipelineExecutionContext({
        id: "transition-test-3",
        prompt: "Build an app",
      });

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "Invalid pipeline transition"
    );
  });
});
