import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  PipelineRunResult,
} from "../src/orchestrator/pipeline-run-result.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("PipelineRunResult", () => {
  it("should represent a completed pipeline", () => {
    const context =
      createPipelineExecutionContext({
        id: "result-test-1",
        prompt: "Build an app",
      });

    const result: PipelineRunResult = {
      status: "COMPLETED",
      context: {
        ...context,
        state: "DECIDING",
      },
      durationMs: 1_234,
    };

    expect(result.status).toBe(
      "COMPLETED"
    );

    expect(result.context.state).toBe(
      "DECIDING"
    );

    expect(result.durationMs).toBe(
      1_234
    );
  });

  it("should represent a failed pipeline", () => {
    const context =
      createPipelineExecutionContext({
        id: "result-test-2",
        prompt: "Build an app",
      });

    const result: PipelineRunResult = {
      status: "FAILED",
      context: {
        ...context,
        state: "FAILED",
        failureReason:
          "Test failure",
      },
      durationMs: 2_345,
    };

    expect(result.status).toBe(
      "FAILED"
    );

    expect(result.context.state).toBe(
      "FAILED"
    );

    expect(
      result.context.failureReason
    ).toBe("Test failure");
  });
});
