import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

import {
  StateTransitionStep,
} from "../src/orchestrator/state-transition-step.js";

import {
  updateExecutionState,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("StateTransitionStep", () => {
  it("should transition to the configured state", async () => {
    const context =
      createPipelineExecutionContext({
        id: "pipeline-transition-1",
        prompt: "Build an app",
      });

    const step =
      new StateTransitionStep(
        "analyzing",
        "ANALYZING"
      );

    const result =
      await step.execute(context);

    expect(result.state).toBe(
      "ANALYZING"
    );

    expect(result.request).toEqual(
      context.request
    );

    expect(result.workspace).toBeNull();
    expect(result.plan).toBeNull();
    expect(result.testResult).toBeNull();
    expect(result.reviewResult).toBeNull();
    expect(result.failureReason).toBeNull();
  });

  it("should preserve execution data during transition", async () => {
    const initial =
      createPipelineExecutionContext({
        id: "pipeline-transition-2",
        prompt: "Build an app",
      });

    const context = {
      ...updateExecutionState(
        initial,
        "ANALYZING"
      ),
      workspace:
        "D:\\workspace\\pipeline-transition-2",
      plan: {
        name: "test-plan",
      },
      testResult: {
        passed: true,
      },
      reviewResult: {
        approved: true,
      },
      failureReason: null,
    };

    const step =
      new StateTransitionStep(
        "planning",
        "PLANNING"
      );

    const result =
      await step.execute(context);

    expect(result.state).toBe(
      "PLANNING"
    );
    expect(result.workspace).toBe(
      context.workspace
    );
    expect(result.plan).toEqual(
      context.plan
    );
    expect(result.testResult).toEqual(
      context.testResult
    );
    expect(result.reviewResult).toEqual(
      context.reviewResult
    );
  });

  it("should reject an invalid state transition", async () => {
    const context =
      createPipelineExecutionContext({
        id: "pipeline-transition-3",
        prompt: "Build an app",
      });

    const step =
      new StateTransitionStep(
        "invalid",
        "COMPLETED"
      );

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "Invalid pipeline transition: STARTING -> COMPLETED"
    );
  });
});
