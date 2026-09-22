import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Agent,
  AgentInput,
} from "../src/agents/agent-contract.js";
import type { AgentResult } from "../src/agents/agent-result.js";

describe("AgentContract", () => {
  it("should support a successful agent result", () => {
    const result: AgentResult = {
      status: "SUCCESS",
      output: "agent completed",
      error: null,
      durationMs: 125,
    };

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(
      "agent completed"
    );
    expect(result.error).toBeNull();
    expect(result.durationMs).toBe(125);
  });

  it("should support a failed agent result", () => {
    const result: AgentResult = {
      status: "FAILURE",
      output: "",
      error: "model failed",
      durationMs: 50,
    };

    expect(result.status).toBe("FAILURE");
    expect(result.output).toBe("");
    expect(result.error).toBe(
      "model failed"
    );
    expect(result.durationMs).toBe(50);
  });

  it("should allow an agent implementation", async () => {
    const agent: Agent = {
      name: "test-agent",

      async run(
        input: AgentInput
      ): Promise<AgentResult> {
        return {
          status: "SUCCESS",
          output: input.prompt,
          error: null,
          durationMs: 1,
        };
      },
    };

    const result = await agent.run({
      pipelineId: "test-pipeline",
      prompt: "build a student app",
      workspace:
        "D:\\project\\web-coding-agent\\workspaces\\test-pipeline",
    });

    expect(agent.name).toBe("test-agent");
    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(
      "build a student app"
    );
  });
});
