import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../src/logging/logger.js";
import { pipelineLogger } from "../src/logging/pipeline-logger.js";

describe("Pipeline Logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log pipeline start", () => {
    const spy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    pipelineLogger.start("pipeline-123");

    expect(spy).toHaveBeenCalledWith(
      "[PIPELINE_START] Pipeline pipeline-123 started"
    );
  });

  it("should log state changes", () => {
    const spy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    pipelineLogger.stateChange(
      "pipeline-123",
      "PLANNING",
      "CODING"
    );

    expect(spy).toHaveBeenCalledWith(
      "[STATE_CHANGE] Pipeline pipeline-123: PLANNING -> CODING"
    );
  });

  it("should log agent lifecycle events", () => {
    const spy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    pipelineLogger.agentStart(
      "pipeline-123",
      "coder"
    );

    pipelineLogger.agentComplete(
      "pipeline-123",
      "coder"
    );

    expect(spy).toHaveBeenNthCalledWith(
      1,
      "[AGENT_START] Pipeline pipeline-123: coder started"
    );

    expect(spy).toHaveBeenNthCalledWith(
      2,
      "[AGENT_COMPLETE] Pipeline pipeline-123: coder completed"
    );
  });

  it("should log test events", () => {
    const spy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    pipelineLogger.testStart("pipeline-123");
    pipelineLogger.testPass("pipeline-123");
    pipelineLogger.testFail(
      "pipeline-123",
      "API returned 500"
    );

    expect(spy).toHaveBeenNthCalledWith(
      1,
      "[TEST_START] Pipeline pipeline-123: tests started"
    );

    expect(spy).toHaveBeenNthCalledWith(
      2,
      "[TEST_PASS] Pipeline pipeline-123: tests passed"
    );

    expect(spy).toHaveBeenNthCalledWith(
      3,
      "[TEST_FAIL] Pipeline pipeline-123: tests failed - API returned 500"
    );
  });

  it("should log pipeline completion", () => {
    const spy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    pipelineLogger.complete("pipeline-123");

    expect(spy).toHaveBeenCalledWith(
      "[PIPELINE_COMPLETE] Pipeline pipeline-123 completed"
    );
  });
});
