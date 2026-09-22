import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AgentExecutor,
} from "../src/agents/agent-executor.js";

import {
  BaseAgent,
} from "../src/agents/base-agent.js";

import type {
  ProcessResult,
} from "../src/runtime/process-result.js";

function createExecutor(
  result: ProcessResult
): AgentExecutor {
  return {
    async execute() {
      return result;
    },
  };
}

function createInput() {
  return {
    pipelineId: "test-pipeline",
    prompt: "test prompt",
    workspace:
      "D:\\project\\web-coding-agent\\workspaces\\test-pipeline",
  };
}

class TestAgent extends BaseAgent {
  constructor(
    executor: AgentExecutor
  ) {
    super(
      "test-agent",
      "test-model",
      executor
    );
  }
}

describe("BaseAgent", () => {
  it("should return SUCCESS when process succeeds", async () => {
    const agent = new TestAgent(
      createExecutor({
        command: "opencode.exe",
        args: [],
        exitCode: 0,
        stdout: "generated output",
        stderr: "",
        timedOut: false,
        durationMs: 100,
      })
    );

    const result = await agent.run(
      createInput()
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(
      "generated output"
    );
    expect(result.error).toBeNull();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should return FAILURE when process exits with non-zero code", async () => {
    const agent = new TestAgent(
      createExecutor({
        command: "opencode.exe",
        args: [],
        exitCode: 1,
        stdout: "partial output",
        stderr: "model failed",
        timedOut: false,
        durationMs: 100,
      })
    );

    const result = await agent.run(
      createInput()
    );

    expect(result.status).toBe("FAILURE");
    expect(result.output).toBe(
      "partial output"
    );
    expect(result.error).toBe(
      "model failed"
    );
  });

  it("should return FAILURE when process times out", async () => {
    const agent = new TestAgent(
      createExecutor({
        command: "opencode.exe",
        args: [],
        exitCode: null,
        stdout: "",
        stderr: "",
        timedOut: true,
        durationMs: 100,
      })
    );

    const result = await agent.run(
      createInput()
    );

    expect(result.status).toBe("FAILURE");
    expect(result.error).toBe(
      "Agent process exited with code null"
    );
  });

  it("should convert executor errors into FAILURE", async () => {
    const executor: AgentExecutor = {
      async execute() {
        throw new Error(
          "OpenCode unavailable"
        );
      },
    };

    const agent = new TestAgent(
      executor
    );

    const result = await agent.run(
      createInput()
    );

    expect(result.status).toBe("FAILURE");
    expect(result.output).toBe("");
    expect(result.error).toBe(
      "OpenCode unavailable"
    );
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should expose the agent name", () => {
    const agent = new TestAgent(
      createExecutor({
        command: "opencode.exe",
        args: [],
        exitCode: 0,
        stdout: "",
        stderr: "",
        timedOut: false,
        durationMs: 0,
      })
    );

    expect(agent.name).toBe(
      "test-agent"
    );
  });
});
