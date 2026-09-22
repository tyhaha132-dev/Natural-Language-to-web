import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AnalysisStep,
} from "../src/orchestrator/analysis-step.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("AnalysisStep", () => {
  it("should analyze a valid pipeline request", async () => {
    const step =
      new AnalysisStep();

    const context =
      createPipelineExecutionContext({
        id: "analysis-test-1",
        prompt:
          "Build a student management web app",
      });

    const result =
      await step.execute(context);

    expect(result.analysis).not.toBeNull();

    expect(result.analysis).toEqual(
      expect.objectContaining({
        projectType: "web-app",
        prompt:
          "Build a student management web app",
        requirements: [
          "Build a student management web app",
        ],
      })
    );

    expect(
      (result.analysis as {
        analyzedAt: string;
      }).analyzedAt
    ).toBeTruthy();

    expect(result.state).toBe(
      "STARTING"
    );
  });

  it("should trim the request prompt", async () => {
    const step =
      new AnalysisStep();

    const context =
      createPipelineExecutionContext({
        id: "analysis-test-2",
        prompt:
          "   Build a web app   ",
      });

    const result =
      await step.execute(context);

    expect(
      (result.analysis as {
        prompt: string;
      }).prompt
    ).toBe(
      "Build a web app"
    );
  });

  it("should reject an empty prompt", async () => {
    const step =
      new AnalysisStep();

    const context =
      createPipelineExecutionContext({
        id: "analysis-test-3",
        prompt: "   ",
      });

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "Pipeline request prompt cannot be empty"
    );
  });
});
