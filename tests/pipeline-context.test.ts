import { describe, expect, it } from "vitest";
import {
  changePipelineState,
  createPipelineContext,
  incrementIteration,
} from "../src/orchestrator/pipeline-context.js";

describe("Pipeline context", () => {
  it("should create a context with initial values", () => {
    const context = createPipelineContext({
      id: "pipeline-123",
      prompt: "Build a student management application",
    });

    expect(context.request.id).toBe("pipeline-123");
    expect(context.request.prompt).toBe(
      "Build a student management application"
    );
    expect(context.state).toBe("STARTING");
    expect(context.iteration).toBe(0);
    expect(context.createdAt).toEqual(context.updatedAt);
  });

  it("should change state through the state machine", () => {
    const context = createPipelineContext({
      id: "pipeline-123",
      prompt: "Build an application",
    });

    const updated = changePipelineState(
      context,
      "ANALYZING"
    );

    expect(updated.state).toBe("ANALYZING");
    expect(updated.request).toEqual(context.request);
    expect(updated.iteration).toBe(0);
  });

  it("should reject invalid state changes", () => {
    const context = createPipelineContext({
      id: "pipeline-123",
      prompt: "Build an application",
    });

    expect(() =>
      changePipelineState(context, "COMPLETED")
    ).toThrow(
      "Invalid pipeline transition: STARTING -> COMPLETED"
    );
  });

  it("should increment the iteration", () => {
    const context = createPipelineContext({
      id: "pipeline-123",
      prompt: "Build an application",
    });

    const updated = incrementIteration(context);

    expect(updated.iteration).toBe(1);
    expect(updated.state).toBe("STARTING");
    expect(updated.request).toEqual(context.request);
  });

  it("should increment iterations independently", () => {
    const context = createPipelineContext({
      id: "pipeline-123",
      prompt: "Build an application",
    });

    const first = incrementIteration(context);
    const second = incrementIteration(first);

    expect(second.iteration).toBe(2);
  });
});
