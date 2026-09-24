import {
  createPipelineOrchestrator,
} from "../application/create-pipeline-orchestrator.js";

import type {
  PipelineRequest,
} from "../contracts/pipeline.js";

export interface PipelineBenchmarkResult {
  readonly status: "COMPLETED" | "FAILED";
  readonly durationMs: number;
  readonly workspace: string | null;
  readonly failureReason: string | null;
}

export async function runPipelineBenchmark(
  request: PipelineRequest
): Promise<PipelineBenchmarkResult> {
  const orchestrator =
    createPipelineOrchestrator();

  const result =
    await orchestrator.execute(request);

  return {
    status: result.status,
    durationMs: result.durationMs,
    workspace:
      result.context.workspace,
    failureReason:
      result.context.failureReason,
  };
}
