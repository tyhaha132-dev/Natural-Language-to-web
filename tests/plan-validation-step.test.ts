import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PlanValidationStep,
} from "../src/orchestrator/plan-validation-step.js";

import {
  createPlanValidator,
} from "../src/planner/plan-validator.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("PlanValidationStep", () => {
  it("should accept a valid plan", async () => {
    const step =
      new PlanValidationStep(
        createPlanValidator()
      );

    const context =
      createPipelineExecutionContext({
        id: "pipeline-1",
        prompt: "Create a student app",
      });

    const result =
      await step.execute({
        ...context,
        plan: {
          prompt: "Create a student app",
          plan: "Build frontend and backend",
          plannedAt:
            new Date().toISOString(),
        },
      });

    expect(result.plan).not.toBeNull();
  });

  it("should reject when plan is missing", async () => {
    const step =
      new PlanValidationStep(
        createPlanValidator()
      );

    const context =
      createPipelineExecutionContext({
        id: "pipeline-2",
        prompt: "Create a student app",
      });

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "PlanValidationStep requires a plan"
    );
  });

  it("should reject an invalid plan", async () => {
    const step =
      new PlanValidationStep(
        createPlanValidator()
      );

    const context =
      createPipelineExecutionContext({
        id: "pipeline-3",
        prompt: "Create a student app",
      });

    await expect(
      step.execute({
        ...context,
        plan: {
          prompt: "",
          plan: "Build something",
          plannedAt:
            new Date().toISOString(),
        },
      })
    ).rejects.toThrow(
      "Plan validation failed"
    );
  });
});
