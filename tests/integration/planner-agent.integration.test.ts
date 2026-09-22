import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createOpenCodeAgentExecutor,
} from "../../src/agents/opencode-agent-executor.js";

import {
  PlannerAgent,
} from "../../src/agents/planner/planner.js";

describe("PlannerAgent OpenCode integration", () => {
  it(
    "should execute PlannerAgent with real OpenCode",
    async () => {
      const executor =
        createOpenCodeAgentExecutor({
          timeoutMs: 120_000,
        });

      const agent =
        new PlannerAgent(executor);

      const result = await agent.run({
        pipelineId:
          "planner-integration-test",
        prompt:
          "Reply with exactly: PLANNER_RUNTIME_OK",
        workspace:
          "D:\\project\\web-coding-agent",
      });

      expect(result.status).toBe(
        "SUCCESS"
      );

      expect(result.output).toContain(
        "PLANNER_RUNTIME_OK"
      );
    },
    150_000
  );
});
