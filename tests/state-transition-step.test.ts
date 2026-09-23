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
  updateExecutionState,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("StateTransitionStep", () => {
  it("should transition pipeline state", async () => {
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

  it("should preserve execution data", async () => {
    const step =
      new StateTransitionStep(
        "ANALYZING -> ENVIRONMENT_SETUP",
        "ENVIRONMENT_SETUP"
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
      workspace: "test-workspace",
      analysis: {
        projectType: "web-app",
      },
      plan: {
        prompt: "Build an app",
        plan: "task-1",
        plannedAt:
          "2026-09-22T00:00:00.000Z",
      },
      testResult: {
        status: "PASSED" as const,
        results: [
          {
            status: "PASSED" as const,
            command: "npm.cmd",
            args: ["test"],
            exitCode: 0,
            stdout: "tests passed",
            stderr: "",
            durationMs: 10,
          },
        ],
      },
      reviewResult: {
        status: "APPROVED" as const,
        output: "Review passed",
        issues: [],
        reviewedAt:
          "2026-09-22T00:00:00.000Z",
      },
      decisionResult: {
        decision: "COMPLETE" as const,
        reason: "Tests passed and review approved",
        decidedAt:
          "2026-09-22T00:00:00.000Z",
      },
      failureReason: null,
    };

    const result =
      await step.execute(
        enrichedContext
      );

    expect(result.state).toBe(
      "ENVIRONMENT_SETUP"
    );

    expect(result.workspace).toBe(
      "test-workspace"
    );

    expect(result.analysis).toEqual({
      projectType: "web-app",
    });

    expect(result.plan).toEqual({
      prompt: "Build an app",
      plan: "task-1",
      plannedAt:
        "2026-09-22T00:00:00.000Z",
    });

    expect(result.testResult).toEqual({
      status: "PASSED",
      results: [
        {
          status: "PASSED",
          command: "npm.cmd",
          args: ["test"],
          exitCode: 0,
          stdout: "tests passed",
          stderr: "",
          durationMs: 10,
        },
      ],
    });

    expect(result.reviewResult).toEqual({
      status: "APPROVED",
      output: "Review passed",
      issues: [],
      reviewedAt:
        "2026-09-22T00:00:00.000Z",
    });

    expect(result.decisionResult).toEqual({
      decision: "COMPLETE",
      reason: "Tests passed and review approved",
      decidedAt:
        "2026-09-22T00:00:00.000Z",
    });

    expect(result.failureReason).toBeNull();
  });

  it("should reject an invalid transition", async () => {
    const step =
      new StateTransitionStep(
        "STARTING -> PLANNING",
        "PLANNING"
      );

    const context =
      createPipelineExecutionContext({
        id: "transition-test-3",
        prompt: "Build an app",
      });

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "Invalid pipeline transition: STARTING -> PLANNING"
    );
  });
});
