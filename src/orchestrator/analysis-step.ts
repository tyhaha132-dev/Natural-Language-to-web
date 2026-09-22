import type {
  AnalysisResult,
} from "./analysis-result.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export class AnalysisStep
  implements PipelineStep
{
  readonly name = "analyze-request";

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    const prompt =
      context.request.prompt.trim();

    if (prompt.length === 0) {
      throw new Error(
        "Pipeline request prompt cannot be empty"
      );
    }

    const analysis: AnalysisResult = {
      projectType: "web-app",
      prompt,
      requirements: [
        prompt,
      ],
      analyzedAt:
        new Date().toISOString(),
    };

    return {
      ...context,
      analysis,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
