import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AgentExecutor,
} from "../src/agents/agent-executor.js";

import {
  createAgentFactory,
} from "../src/agents/agent-factory.js";

describe("AgentFactory", () => {
  const executor: AgentExecutor = {
    async execute() {
      return {
        command: "opencode.exe",
        args: [],
        exitCode: 0,
        stdout: "ok",
        stderr: "",
        timedOut: false,
        durationMs: 1,
      };
    },
  };

  it("should create a planner agent", () => {
    const factory =
      createAgentFactory(executor);

    const agent =
      factory.create("planner");

    expect(agent.name).toBe("planner");
  });

  it("should create a coder agent", () => {
    const factory =
      createAgentFactory(executor);

    const agent =
      factory.create("coder");

    expect(agent.name).toBe("coder");
  });

  it("should create a reviewer agent", () => {
    const factory =
      createAgentFactory(executor);

    const agent =
      factory.create("reviewer");

    expect(agent.name).toBe("reviewer");
  });
});
