import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AgentService,
} from "../src/agents/agent-service.js";

import {
  PlanningStep,
} from "../src/orchestrator/planning-step.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("PlanningStep", () => {
  it("should create a plan from the planner agent output", async () => {
    const agentService: AgentService = {
      async run(role, input) {
        expect(role).toBe("planner");

        expect(input.pipelineId).toBe(
          "planning-test-1"
        );

        expect(input.prompt).toBe(
          "Build a student management app"
        );

        expect(input.workspace).toBe(
          "D:\\workspace\\planning-test-1"
        );

        return {
          status: "SUCCESS",
          output:
            "1. Create frontend\n2. Create backend\n3. Add PostgreSQL",
          error: null,
          durationMs: 10,
        };
      },
    };

    const step =
      new PlanningStep(agentService);

    const initialContext =
      createPipelineExecutionContext({
        id: "planning-test-1",
        prompt:
          "Build a student management app",
      });

    const context = {
      ...initialContext,
      workspace:
        "D:\\workspace\\planning-test-1",
    };

    const result =
      await step.execute(context);

    expect(result.plan).not.toBeNull();

    expect(result.plan).toEqual(
      expect.objectContaining({
        prompt:
          "Build a student management app",
        plan:
          "1. Create frontend\n2. Create backend\n3. Add PostgreSQL",
      })
    );

    expect(
      (result.plan as {
        plannedAt: string;
      }).plannedAt
    ).toBeTruthy();
  });

  it("should reject when workspace is missing", async () => {
    const agentService: AgentService = {
      async run() {
        throw new Error(
          "AgentService should not be called"
        );
      },
    };

    const step =
      new PlanningStep(agentService);

    const context =
      createPipelineExecutionContext({
        id: "planning-test-2",
        prompt: "Build an app",
      });

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "PlanningStep requires a workspace"
    );
  });

  it("should reject when planner agent fails", async () => {
    const agentService: AgentService = {
      async run(role) {
        expect(role).toBe("planner");

        return {
          status: "FAILURE",
          output: "",
          error: "Planner failed",
          durationMs: 10,
        };
      },
    };

    const step =
      new PlanningStep(agentService);

    const initialContext =
      createPipelineExecutionContext({
        id: "planning-test-3",
        prompt: "Build an app",
      });

    const context = {
      ...initialContext,
      workspace:
        "D:\\workspace\\planning-test-3",
    };

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "Planner failed"
    );
  });
});
