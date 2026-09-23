import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  DecisionStep,
} from "../src/orchestrator/decision-step.js";

import type {
  DecisionEngine,
} from "../src/orchestrator/decision-engine.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("DecisionStep", () => {
  it("should store COMPLETE decision result", async () => {
    const decisionEngine:
      DecisionEngine = {
      decide: vi.fn().mockReturnValue({
        decision: "COMPLETE",
        reason:
          "Tests passed and review approved",
        decidedAt:
          "2026-09-22T00:00:00.000Z",
      }),
    };

    const step =
      new DecisionStep({
        decisionEngine,
      });

    const context =
      createPipelineExecutionContext({
        id: "decision-step-1",
        prompt: "Build a web app",
      });

    const result =
      await step.execute(context);

    expect(
      decisionEngine.decide
    ).toHaveBeenCalledWith(
      context
    );

    expect(
      result.decisionResult
    ).toEqual({
      decision: "COMPLETE",
      reason:
        "Tests passed and review approved",
      decidedAt:
        "2026-09-22T00:00:00.000Z",
    });
  });

  it("should store RETRY decision result", async () => {
    const decisionEngine:
      DecisionEngine = {
      decide: vi.fn().mockReturnValue({
        decision: "RETRY",
        reason:
          "Tests failed and another iteration is available",
        decidedAt:
          "2026-09-22T00:00:00.000Z",
      }),
    };

    const step =
      new DecisionStep({
        decisionEngine,
      });

    const context =
      createPipelineExecutionContext({
        id: "decision-step-2",
        prompt: "Build a web app",
      });

    const result =
      await step.execute(context);

    expect(
      result.decisionResult
    ).toEqual({
      decision: "RETRY",
      reason:
        "Tests failed and another iteration is available",
      decidedAt:
        "2026-09-22T00:00:00.000Z",
    });
  });

  it("should preserve existing pipeline data", async () => {
    const decisionEngine:
      DecisionEngine = {
      decide: vi.fn().mockReturnValue({
        decision: "COMPLETE",
        reason: "All checks passed",
        decidedAt:
          "2026-09-22T00:00:00.000Z",
      }),
    };

    const step =
      new DecisionStep({
        decisionEngine,
      });

    const context =
      createPipelineExecutionContext({
        id: "decision-step-3",
        prompt: "Build a web app",
      });

    const enrichedContext = {
      ...context,
      workspace:
        "C:\\workspace\\app",
      analysis: {
        projectType: "web-app",
      },
      plan: {
        prompt: "Build a web app",
        plan: "Create frontend and backend",
        plannedAt:
          "2026-09-22T00:00:00.000Z",
      },
    };

    const result =
      await step.execute(
        enrichedContext
      );

    expect(result.workspace).toBe(
      "C:\\workspace\\app"
    );

    expect(result.analysis).toEqual({
      projectType: "web-app",
    });

    expect(result.plan).toEqual({
      prompt: "Build a web app",
      plan:
        "Create frontend and backend",
      plannedAt:
        "2026-09-22T00:00:00.000Z",
    });

    expect(
      result.decisionResult
    ).toEqual({
      decision: "COMPLETE",
      reason: "All checks passed",
      decidedAt:
        "2026-09-22T00:00:00.000Z",
    });
  });
});
