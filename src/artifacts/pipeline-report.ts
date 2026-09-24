import type {
  PipelineRequest,
} from "../contracts/pipeline.js";

import type {
  PipelineRunResult,
} from "../orchestrator/pipeline-run-result.js";

import {
  getArtifactPath,
} from "./artifact-path.js";

import {
  writeArtifact,
} from "./artifact-store.js";

export const PIPELINE_RUN_REPORT_NAME =
  "run-report.json";

export interface PipelineRunReport {
  readonly pipelineId: string;
  readonly prompt: string;
  readonly status:
    | "COMPLETED"
    | "FAILED";
  readonly state: string;
  readonly iteration: number;
  readonly durationMs: number;
  readonly workspace: string | null;
  readonly failureReason:
    | string
    | null;
  readonly retryFeedbackUsed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly reportedAt: string;
}

export function buildPipelineRunReport(
  request: PipelineRequest,
  result: PipelineRunResult
): PipelineRunReport {
  return {
    pipelineId: request.id,
    prompt: request.prompt,
    status: result.status,
    state: result.context.state,
    iteration:
      result.context.iteration,
    durationMs:
      result.durationMs,
    workspace:
      result.context.workspace,
    failureReason:
      result.context.failureReason,
    retryFeedbackUsed:
      result.context.retryFeedback !==
        null &&
      result.context.iteration >
        0,
    createdAt:
      result.context.createdAt,
    updatedAt:
      result.context.updatedAt,
    reportedAt:
      new Date().toISOString(),
  };
}

export async function savePipelineRunReport(
  request: PipelineRequest,
  result: PipelineRunResult
): Promise<string> {
  const report =
    buildPipelineRunReport(
      request,
      result
    );

  await writeArtifact(
    request.id,
    PIPELINE_RUN_REPORT_NAME,
    JSON.stringify(report, null, 2)
  );

  return getArtifactPath(
    request.id,
    PIPELINE_RUN_REPORT_NAME
  );
}
