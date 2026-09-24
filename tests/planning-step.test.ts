import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PlanningStep,
} from "../src/orchestrator/planning-step.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("PlanningStep", () => {
  it("should create a plan from the planner agent output", async () => {
    const agentService = {
      run: async (
        role: string,
        input: {
          pipelineId: string;
          workspace: string;
          prompt: string;
        }
      ) => {
        expect(role).toBe("planner");

        expect(input.prompt).toContain(
          "Build a student management app"
        );

        expect(input.prompt).toContain(
          "Your ONLY job is to analyze the user's request and produce an implementation plan."
        );

        expect(input.prompt).toContain(
          "Do NOT modify any files."
        );

        expect(input.prompt).toContain(
          "Treat the workspace as READ-ONLY during this step."
        );

        expect(input.prompt).toContain(
          "Return only the implementation plan."
        );

        return {
          status: "SUCCESS" as const,
          output: "1. Create student model\n2. Create CRUD API",
          error: null,
          durationMs: 10,
        };
      },
    };

    const step = new PlanningStep(
      agentService as never
    );

    const context =
      createPipelineExecutionContext({
        id: "pipeline-1",
        prompt: "Build a student management app",
      });

    const result =
      await step.execute({
        ...context,
        workspace:
          "D:\\project\\web-coding-agent\\workspaces\\pipeline-1",
      });

    expect(result.plan).not.toBeNull();

    expect(result.plan?.plan).toBe(
      "1. Create student model\n2. Create CRUD API"
    );

    expect(result.plan?.prompt).toBe(
      "Build a student management app"
    );

    expect(result.plan?.plannedAt).toEqual(
      expect.any(String)
    );
  });

  it("should reject when workspace is missing", async () => {
    const agentService = {
      run: async () => {
        throw new Error(
          "Agent should not be called"
        );
      },
    };

    const step = new PlanningStep(
      agentService as never
    );

    const context =
      createPipelineExecutionContext({
        id: "pipeline-2",
        prompt: "Build an app",
      });

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "PlanningStep requires a workspace"
    );
  });

  it("should reject when planner agent fails", async () => {
    const agentService = {
      run: async () => ({
        status: "FAILURE" as const,
        output: "",
        error: "Planner process failed",
        durationMs: 10,
      }),
    };

    const step = new PlanningStep(
      agentService as never
    );

    const context =
      createPipelineExecutionContext({
        id: "pipeline-3",
        prompt: "Build an app",
      });

    await expect(
      step.execute({
        ...context,
        workspace:
          "D:\\project\\web-coding-agent\\workspaces\\pipeline-3",
      })
    ).rejects.toThrow(
      "Planner process failed"
    );
  });
});
