import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AgentService,
} from "../src/agents/agent-service.js";

import type {
  AgentRole,
} from "../src/agents/agent-factory.js";

import type {
  AgentResult,
} from "../src/agents/agent-result.js";

import {
  CodingStep,
} from "../src/orchestrator/coding-step.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("CodingStep", () => {
  it("should run coder and store coding result", async () => {
    let receivedPrompt = "";

    const agentService: AgentService = {
      async run(
        role: AgentRole,
        input
      ): Promise<AgentResult> {
        expect(role).toBe("coder");

        receivedPrompt =
          input.prompt;

        expect(
          input.pipelineId
        ).toBe("coding-test-1");

        expect(
          input.workspace
        ).toBe("test-workspace");

        return {
          status: "SUCCESS",
          output: "code generated",
          error: null,
          durationMs: 1,
        };
      },
    };

    const step =
      new CodingStep(
        agentService
      );

    const context =
      createPipelineExecutionContext({
        id: "coding-test-1",
        prompt:
          "Create a student app",
      });

    const result =
      await step.execute({
        ...context,
        workspace:
          "test-workspace",
        plan: {
          prompt:
            "Create a student app",
          plan:
            "Build React frontend and Node backend",
          plannedAt:
            new Date().toISOString(),
        },
      });

    expect(
      receivedPrompt
    ).toContain(
      "Create a student app"
    );

    expect(
      receivedPrompt
    ).toContain(
      "Build React frontend and Node backend"
    );

    expect(
      receivedPrompt
    ).toContain(
      "Runtime requirements:"
    );

    expect(
      receivedPrompt
    ).toContain(
      "If you create a Node.js HTTP application, the server port MUST be read from process.env.PORT."
    );

    expect(
      receivedPrompt
    ).toContain(
      "Do NOT hard-code the server port."
    );

    expect(
      receivedPrompt
    ).toContain(
      "The application must listen on the port provided through process.env.PORT."
    );

    expect(
      result.codingResult
    ).not.toBeNull();

    expect(
      result.codingResult?.output
    ).toBe(
      "code generated"
    );
  });

  it("should reject when workspace is missing", async () => {
    const agentService: AgentService = {
      async run(
        _role,
        _input
      ): Promise<AgentResult> {
        throw new Error(
          "should not be called"
        );
      },
    };

    const step =
      new CodingStep(
        agentService
      );

    const context =
      createPipelineExecutionContext({
        id: "coding-test-2",
        prompt:
          "Create a student app",
      });

    await expect(
      step.execute({
        ...context,
        workspace: null,
        plan: {
          prompt:
            "Create a student app",
          plan:
            "Build application",
          plannedAt:
            new Date().toISOString(),
        },
      })
    ).rejects.toThrow(
      "CodingStep requires a workspace"
    );
  });

  it("should reject when plan is missing", async () => {
    const agentService: AgentService = {
      async run(
        _role,
        _input
      ): Promise<AgentResult> {
        throw new Error(
          "should not be called"
        );
      },
    };

    const step =
      new CodingStep(
        agentService
      );

    const context =
      createPipelineExecutionContext({
        id: "coding-test-3",
        prompt:
          "Create a student app",
      });

    await expect(
      step.execute({
        ...context,
        workspace:
          "test-workspace",
        plan: null,
      })
    ).rejects.toThrow(
      "CodingStep requires a plan"
    );
  });

  it("should propagate coder failure", async () => {
    const agentService: AgentService = {
      async run(
        _role,
        _input
      ): Promise<AgentResult> {
        return {
          status: "FAILURE",
          output: "",
          error:
            "Coder execution failed",
          durationMs: 1,
        };
      },
    };

    const step =
      new CodingStep(
        agentService
      );

    const context =
      createPipelineExecutionContext({
        id: "coding-test-4",
        prompt:
          "Create a student app",
      });

    await expect(
      step.execute({
        ...context,
        workspace:
          "test-workspace",
        plan: {
          prompt:
            "Create a student app",
          plan:
            "Build application",
          plannedAt:
            new Date().toISOString(),
        },
      })
    ).rejects.toThrow(
      "Coder execution failed"
    );
  });
});
