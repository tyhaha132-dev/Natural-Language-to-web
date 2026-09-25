import {
  describe,
  expect,
  it,
} from "vitest";

import {
  promises as fs,
} from "node:fs";

import {
  buildPipelineRunReport,
  PIPELINE_RUN_REPORT_NAME,
  savePipelineRunReport,
} from "../src/artifacts/pipeline-report.js";

import {
  getArtifactPath,
  getPipelineArtifactDirectory,
} from "../src/artifacts/artifact-path.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

describe("pipeline-report", () => {
  it("should build a run report from the pipeline result", () => {
    const base =
      createPipelineExecutionContext({
        id: "report-test-1",
        prompt: "Build a landing page",
      });

    const report =
      buildPipelineRunReport(
        {
          id: "report-test-1",
          prompt:
            "Build a landing page",
        },
        {
          status: "COMPLETED",
          durationMs: 1234,
          context: {
            ...base,
            state: "COMPLETED",
            iteration: 1,
            workspace:
              "workspaces/report-test-1",
            failureReason: null,
            retryFeedback:
              "Feedback from iteration 0",
          },
        }
      );

    expect(report.pipelineId).toBe(
      "report-test-1"
    );

    expect(report.status).toBe(
      "COMPLETED"
    );

    expect(report.iteration).toBe(1);

    expect(
      report.retryFeedbackUsed
    ).toBe(true);

    expect(
      report.reportedAt.length
    ).toBeGreaterThan(0);
  });

  it("should mark retryFeedbackUsed false on first-try runs", () => {
    const base =
      createPipelineExecutionContext({
        id: "report-test-2",
        prompt: "Build a landing page",
      });

    const report =
      buildPipelineRunReport(
        {
          id: "report-test-2",
          prompt:
            "Build a landing page",
        },
        {
          status: "FAILED",
          durationMs: 10,
          context: {
            ...base,
            state: "FAILED",
            failureReason: "boom",
          },
        }
      );

    expect(
      report.retryFeedbackUsed
    ).toBe(false);

    expect(
      report.failureReason
    ).toBe("boom");
  });

  it("should save the report as a pipeline artifact", async () => {
    const pipelineId = `report-test-save-${process.pid}`;

    const base =
      createPipelineExecutionContext({
        id: pipelineId,
        prompt: "Build a landing page",
      });

    const expectedPath =
      getArtifactPath(
        pipelineId,
        PIPELINE_RUN_REPORT_NAME
      );

    const actualPath =
      await savePipelineRunReport(
        {
          id: pipelineId,
          prompt:
            "Build a landing page",
        },
        {
          status: "COMPLETED",
          durationMs: 42,
          context: {
            ...base,
            state: "COMPLETED",
          },
        }
      );

    expect(actualPath).toBe(
      expectedPath
    );

    const raw = await fs.readFile(
      actualPath,
      "utf8"
    );

    const parsed = JSON.parse(raw);

    expect(parsed.pipelineId).toBe(
      pipelineId
    );

    expect(parsed.status).toBe(
      "COMPLETED"
    );

    await fs.rm(
      getPipelineArtifactDirectory(
        pipelineId
      ),
      {
        recursive: true,
        force: true,
      }
    );
  });
});
