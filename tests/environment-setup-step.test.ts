import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EnvironmentSetupStep,
} from "../src/orchestrator/environment-setup-step.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

import {
  workspaceExists,
  getWorkspaceDirectory,
} from "../src/workspace/workspace-manager.js";

import {
  promises as fs,
} from "node:fs";

describe("EnvironmentSetupStep", () => {
  it("should create workspace and initialize git repository", async () => {
    const pipelineId =
      "environment-test-1";

    const step =
      new EnvironmentSetupStep();

    const context =
      createPipelineExecutionContext({
        id: pipelineId,
        prompt: "Build an app",
      });

    const result =
      await step.execute(context);

    expect(result.workspace).not.toBeNull();

    expect(result.workspace).toContain(
      pipelineId
    );

    expect(
      await workspaceExists(pipelineId)
    ).toBe(true);

    const gitDirectory =
      `${getWorkspaceDirectory(pipelineId)}/.git`;

    const gitStats =
      await fs.stat(gitDirectory);

    expect(gitStats.isDirectory()).toBe(true);
  });
});
