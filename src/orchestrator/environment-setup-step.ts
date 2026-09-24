import {
  createWorkspace,
} from "../workspace/workspace-manager.js";

import {
  createGitManager,
  type GitManager,
} from "../git/git-manager.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export interface EnvironmentSetupStepOptions {
  readonly gitManagerFactory?: (
    workspace: string
  ) => GitManager;
}

export class EnvironmentSetupStep
  implements PipelineStep
{
  readonly name = "setup-environment";

  private readonly gitManagerFactory: (
    workspace: string
  ) => GitManager;

  constructor(
    options: EnvironmentSetupStepOptions = {}
  ) {
    this.gitManagerFactory =
      options.gitManagerFactory ??
      createGitManager;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    const workspace =
      await createWorkspace(
        context.request.id
      );

    const git =
      this.gitManagerFactory(workspace);

    const result =
      await git.init();

    if (
      result.timedOut ||
      result.exitCode !== 0
    ) {
      throw new Error(
        result.stderr.trim() ||
        `Git initialization failed with exit code ${result.exitCode}`
      );
    }

    return {
      ...context,
      workspace,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
