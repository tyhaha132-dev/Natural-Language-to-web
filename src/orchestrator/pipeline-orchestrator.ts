import type {
  PipelineRequest,
} from "../contracts/pipeline.js";

import type {
  PipelineRunResult,
} from "./pipeline-run-result.js";

export interface PipelineOrchestrator {
  execute(
    request: PipelineRequest
  ): Promise<PipelineRunResult>;
}
