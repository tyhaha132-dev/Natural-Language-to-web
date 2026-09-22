import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPipelineLoggerObserver,
} from "../src/orchestrator/pipeline-logger-observer.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

import {
  pipelineLogger,
} from "../src/logging/pipeline-logger.js";

describe("PipelineLoggerObserver", () => {
  it("should log pipeline start", () => {
    const spy = vi
      .spyOn(pipelineLogger, "start")
      .mockImplementation(() => {});

    const observer =
      createPipelineLoggerObserver();

    const context =
      createPipelineExecutionContext({
        id: "logger-pipeline-1",
        prompt: "Build an app",
      });

    observer.onStart(context);

    expect(spy).toHaveBeenCalledWith(
      "logger-pipeline-1"
    );

    spy.mockRestore();
  });

  it("should log state changes", () => {
    const spy = vi
      .spyOn(pipelineLogger, "stateChange")
      .mockImplementation(() => {});

    const observer =
      createPipelineLoggerObserver();

    const context =
      createPipelineExecutionContext({
        id: "logger-pipeline-2",
        prompt: "Build an app",
      });

    observer.onStateChange(
      "STARTING",
      {
        ...context,
        state: "ANALYZING",
      }
    );

    expect(spy).toHaveBeenCalledWith(
      "logger-pipeline-2",
      "STARTING",
      "ANALYZING"
    );

    spy.mockRestore();
  });

  it("should log pipeline completion", () => {
    const spy = vi
      .spyOn(pipelineLogger, "complete")
      .mockImplementation(() => {});

    const observer =
      createPipelineLoggerObserver();

    const context =
      createPipelineExecutionContext({
        id: "logger-pipeline-3",
        prompt: "Build an app",
      });

    observer.onComplete({
      ...context,
      state: "DECIDING",
    });

    expect(spy).toHaveBeenCalledWith(
      "logger-pipeline-3"
    );

    spy.mockRestore();
  });

  it("should log pipeline failure", () => {
    const spy = vi
      .spyOn(pipelineLogger, "failed")
      .mockImplementation(() => {});

    const observer =
      createPipelineLoggerObserver();

    const context =
      createPipelineExecutionContext({
        id: "logger-pipeline-4",
        prompt: "Build an app",
      });

    observer.onFailure(
      new Error("Pipeline failed"),
      {
        ...context,
        state: "FAILED",
        failureReason: "Pipeline failed",
      }
    );

    expect(spy).toHaveBeenCalledWith(
      "logger-pipeline-4",
      "Pipeline failed"
    );

    spy.mockRestore();
  });
});

