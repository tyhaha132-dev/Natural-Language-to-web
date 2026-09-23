import {
  createWorkspace,
} from "../workspace/workspace-manager.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export class EnvironmentSetupStep
  implements PipelineStep
{
  readonly name = "setup-environment";

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    const workspace =
      await createWorkspace(
        context.request.id
      );

    return {
      ...context,
      workspace,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
