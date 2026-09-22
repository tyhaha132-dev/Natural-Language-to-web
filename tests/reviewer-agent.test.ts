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
  ReviewerAgent,
} from "../src/agents/reviewer/reviewer.js";

describe("ReviewerAgent", () => {
  it("should use the reviewer model", async () => {
    let receivedModel = "";

    const executor: AgentExecutor = {
      async execute(input, model) {
        receivedModel = model;

        expect(input.prompt).toBe(
          "review the generated application"
        );

        return {
          command: "opencode.exe",
          args: [],
          exitCode: 0,
          stdout: "review completed",
          stderr: "",
          timedOut: false,
          durationMs: 10,
        };
      },
    };

    const agent = new ReviewerAgent(
      executor
    );

    const result = await agent.run({
      pipelineId: "pipeline-001",
      prompt:
        "review the generated application",
      workspace:
        "D:\\project\\web-coding-agent\\workspaces\\pipeline-001",
    });

    expect(agent.name).toBe("reviewer");
    expect(receivedModel).toBe(
      MODELS.reviewer
    );

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(
      "review completed"
    );
  });
});
