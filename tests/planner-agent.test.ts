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
  PlannerAgent,
} from "../src/agents/planner/planner.js";

describe("PlannerAgent", () => {
  it("should use the planner model", async () => {
    const calls: Array<{
      model: string;
      prompt: string;
      workspace: string;
    }> = [];

    const executor: AgentExecutor = {
      async execute(input, model) {
        calls.push({
          model,
          prompt: input.prompt,
          workspace: input.workspace,
        });

        return {
          command: "opencode.exe",
          args: [],
          exitCode: 0,
          stdout: "plan generated",
          stderr: "",
          timedOut: false,
          durationMs: 10,
        };
      },
    };

    const agent = new PlannerAgent(
      executor
    );

    const result = await agent.run({
      pipelineId: "pipeline-001",
      prompt: "build a student management app",
      workspace:
        "D:\\project\\web-coding-agent\\workspaces\\pipeline-001",
    });

    expect(agent.name).toBe("planner");

    expect(calls).toEqual([
      {
        model: MODELS.planner,
        prompt:
          "build a student management app",
        workspace:
          "D:\\project\\web-coding-agent\\workspaces\\pipeline-001",
      },
    ]);

    expect(result.status).toBe("SUCCESS");
    expect(result.output).toBe(
      "plan generated"
    );
  });
});
