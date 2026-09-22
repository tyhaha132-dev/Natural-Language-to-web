import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AgentInput,
} from "../src/agents/agent-contract.js";

import {
  createOpenCodeAgentExecutor,
} from "../src/agents/opencode-agent-executor.js";

import {
  runOpenCode,
} from "../src/runtime/opencode-runner.js";

vi.mock(
  "../src/runtime/opencode-runner.js",
  () => ({
    runOpenCode: vi.fn(),
  })
);

const mockedRunOpenCode =
  vi.mocked(runOpenCode);

const input: AgentInput = {
  pipelineId: "test-pipeline",
  prompt: "build a student app",
  workspace:
    "D:\\project\\web-coding-agent\\workspaces\\test-pipeline",
};

describe("OpenCodeAgentExecutor", () => {
  it("should forward agent input to OpenCode", async () => {
    mockedRunOpenCode.mockResolvedValue({
      command: "opencode.exe",
      args: [
        "run",
        "--model",
        "test-model",
        "build a student app",
      ],
      exitCode: 0,
      stdout: "completed",
      stderr: "",
      timedOut: false,
      durationMs: 100,
    });

    const executor =
      createOpenCodeAgentExecutor({
        timeoutMs: 30_000,
      });

    const result = await executor.execute(
      input,
      "test-model"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("completed");

    expect(mockedRunOpenCode).toHaveBeenCalledWith({
      model: "test-model",
      prompt: "build a student app",
      cwd: input.workspace,
      timeoutMs: 30_000,
      env: undefined,
    });
  });
});
