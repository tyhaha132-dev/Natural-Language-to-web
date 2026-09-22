import {
  describe,
  expect,
  it,
} from "vitest";

import { MODELS } from "../src/config/models.js";
import type {
  AgentExecutor,
} from "../src/agents/agent-executor.js";
import {
  CoderAgent,
} from "../src/agents/coder/coder.js";

describe("CoderAgent", () => {
  it("should use the coder model", async () => {
    let receivedModel = "";

    const executor: AgentExecutor = {
      async execute(input, model) {
        receivedModel = model;

        expect(input.prompt).toBe(
          "implement the planned application"
        );

        return {
          command: "opencode.exe",
          args: [],
          exitCode: 0,
          stdout: "code generated",
          stderr: "",
          timedOut: false,
          durationMs: 10,
        };
      },
    };

    const agent = new CoderAgent(
      executor
    );

    const result = await agent.run({
      pipelineId: "pipeline-001",
      prompt:
        "implement the planned application",
      workspace:
        "D:\\project\\web-coding-agent\\workspaces\\pipeline-001",
    });

    expect(agent.name).toBe("coder");
    expect(receivedModel).toBe(
      MODELS.coder
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(
      "code generated"
    );
  });
});
