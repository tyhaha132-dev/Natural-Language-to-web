import type {
  PipelineExecutionContext,
} from "../orchestrator/pipeline-execution-context.js";

export interface PipelineStep {
  readonly name: string;

  execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext>;
}
