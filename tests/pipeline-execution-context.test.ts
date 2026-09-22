import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPipelineExecutionContext,
  incrementExecutionIteration,
  setFailure,
  setWorkspace,
  updateExecutionState,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("PipelineExecutionContext", () => {
  it("should create a context with initial execution values", () => {
    const context =
      createPipelineExecutionContext({
        id: "pipeline-1",
        prompt: "Build a student management app",
      });

    expect(context.state).toBe("STARTING");
    expect(context.iteration).toBe(0);
    expect(context.workspace).toBeNull();
    expect(context.plan).toBeNull();
    expect(context.testResult).toBeNull();
    expect(context.reviewResult).toBeNull();
    expect(context.failureReason).toBeNull();
  });

  it("should update the pipeline state", () => {
    const context =
      createPipelineExecutionContext({
        id: "pipeline-2",
        prompt: "Build a todo app",
      });

    const updated =
      updateExecutionState(
        context,
        "ANALYZING"
      );

    expect(updated.state).toBe(
      "ANALYZING"
    );
    expect(updated.request).toEqual(
      context.request
    );
  });

  it("should set the workspace", () => {
    const context =
      createPipelineExecutionContext({
        id: "pipeline-3",
        prompt: "Build an app",
      });

    const updated =
      setWorkspace(
        context,
        "D:\\project\\web-coding-agent\\workspaces\\pipeline-3"
      );

    expect(updated.workspace).toBe(
      "D:\\project\\web-coding-agent\\workspaces\\pipeline-3"
    );
  });

  it("should increment the iteration", () => {
    const context =
      createPipelineExecutionContext({
        id: "pipeline-4",
        prompt: "Build an app",
      });

    const updated =
      incrementExecutionIteration(
        context
      );

    expect(updated.iteration).toBe(1);
    expect(context.iteration).toBe(0);
  });

  it("should mark the pipeline as failed", () => {
    const context =
      createPipelineExecutionContext({
        id: "pipeline-5",
        prompt: "Build an app",
      });

    const failed =
      setFailure(
        context,
        "Environment setup failed"
      );

    expect(failed.state).toBe("FAILED");
    expect(failed.failureReason).toBe(
      "Environment setup failed"
    );
  });
});
