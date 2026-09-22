import {
  describe,
  expect,
  it,
} from "vitest";
import type { Agent } from "../src/agents/agent-contract.js";
import {
  runAgent,
} from "../src/agents/agent-runner.js";

const input = {
  pipelineId: "test-pipeline",
  prompt: "test prompt",
  workspace:
    "D:\\project\\web-coding-agent\\workspaces\\test-pipeline",
};

describe("AgentRunner", () => {
  it("should return a successful agent result", async () => {
    const agent: Agent = {
      name: "success-agent",

      async run() {
        return {
          status: "SUCCESS",
          output: "completed",
          error: null,
          durationMs: 999_999,
        };
      },
    };

    const result = await runAgent(
      agent,
      input
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(
      "completed"
    );
    expect(result.error).toBeNull();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.durationMs).not.toBe(
      999_999
    );
  });

  it("should convert an Error into a failure result", async () => {
    const agent: Agent = {
      name: "failing-agent",

      async run() {
        throw new Error(
          "model execution failed"
        );
      },
    };

    const result = await runAgent(
      agent,
      input
    );

    expect(result.status).toBe("FAILURE");
    expect(result.output).toBe("");
    expect(result.error).toBe(
      "model execution failed"
    );
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should convert unknown thrown values into a failure result", async () => {
    const agent: Agent = {
      name: "unknown-error-agent",

      async run() {
        throw "unexpected failure";
      },
    };

    const result = await runAgent(
      agent,
      input
    );

    expect(result.status).toBe("FAILURE");
    expect(result.output).toBe("");
    expect(result.error).toBe(
      "unexpected failure"
    );
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
