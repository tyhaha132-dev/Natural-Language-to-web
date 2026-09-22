import { describe, expect, it } from "vitest";
import type {
  PipelineContext,
  PipelineRequest,
  PipelineState,
} from "../src/contracts/pipeline.js";

describe("Pipeline contracts", () => {
  it("should allow a valid pipeline request", () => {
    const request: PipelineRequest = {
      id: "pipeline-123",
      prompt: "Build a student management application",
    };

    expect(request.id).toBe("pipeline-123");
    expect(request.prompt).toBe(
      "Build a student management application"
    );
  });

  it("should allow valid pipeline states", () => {
    const states: PipelineState[] = [
      "STARTING",
      "ANALYZING",
      "PLANNING",
      "PLAN_VALIDATING",
      "ENVIRONMENT_SETUP",
      "CODING",
      "DATABASE_SETUP",
      "TESTING",
      "REVIEWING",
      "DECIDING",
      "COMPLETED",
      "FAILED",
    ];

    expect(states).toHaveLength(12);
    expect(new Set(states).size).toBe(12);
  });

  it("should allow a valid pipeline context", () => {
    const context: PipelineContext = {
      request: {
        id: "pipeline-123",
        prompt: "Build a student management application",
      },
      state: "STARTING",
      iteration: 0,
      createdAt: "2026-09-22T00:00:00.000Z",
      updatedAt: "2026-09-22T00:00:00.000Z",
    };

    expect(context.state).toBe("STARTING");
    expect(context.iteration).toBe(0);
    expect(context.request.id).toBe("pipeline-123");
  });
});
