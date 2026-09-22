import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Agent,
} from "../src/agents/agent-contract.js";

import type {
  AgentFactory,
  AgentRole,
} from "../src/agents/agent-factory.js";

import {
  createAgentService,
} from "../src/agents/agent-service.js";

describe("AgentService", () => {
  it("should create and run the requested agent", async () => {
    let requestedRole: AgentRole | null =
      null;

    const agent: Agent = {
      name: "test-agent",

      async run(input) {
        expect(input.pipelineId).toBe(
          "pipeline-001"
        );

        expect(input.prompt).toBe(
          "build application"
        );

        return {
          status: "SUCCESS",
          output: "application completed",
          error: null,
          durationMs: 5,
        };
      },
    };

    const factory: AgentFactory = {
      create(role) {
        requestedRole = role;
        return agent;
      },
    };

    const service =
      createAgentService(factory);

    const result = await service.run(
      "coder",
      {
        pipelineId: "pipeline-001",
        prompt: "build application",
        workspace:
          "D:\\project\\web-coding-agent\\workspaces\\pipeline-001",
      }
    );

    expect(requestedRole).toBe(
      "coder"
    );

    expect(result.status).toBe(
      "SUCCESS"
    );

    expect(result.output).toBe(
      "application completed"
    );
  });

  it("should propagate agent failure", async () => {
    const agent: Agent = {
      name: "failing-agent",

      async run() {
        return {
          status: "FAILURE",
          output: "",
          error: "agent failed",
          durationMs: 5,
        };
      },
    };

    const factory: AgentFactory = {
      create() {
        return agent;
      },
    };

    const service =
      createAgentService(factory);

    const result = await service.run(
      "reviewer",
      {
        pipelineId: "pipeline-002",
        prompt: "review application",
        workspace:
          "D:\\project\\web-coding-agent\\workspaces\\pipeline-002",
      }
    );

    expect(result.status).toBe(
      "FAILURE"
    );

    expect(result.error).toBe(
      "agent failed"
    );
  });
});
