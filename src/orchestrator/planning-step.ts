import type {
  AgentService,
} from "../agents/agent-service.js";

import type {
  PlanResult,
} from "./plan-result.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export class PlanningStep
  implements PipelineStep
{
  readonly name = "create-plan";

  private readonly agentService: AgentService;

  constructor(
    agentService: AgentService
  ) {
    this.agentService = agentService;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    if (context.workspace === null) {
      throw new Error(
        "PlanningStep requires a workspace"
      );
    }

    const result =
      await this.agentService.run(
        "planner",
        {
          pipelineId:
            context.request.id,
          prompt:
            context.request.prompt,
          workspace:
            context.workspace,
        }
      );

    if (result.status !== "SUCCESS") {
      throw new Error(
        result.error ??
          "Planner agent failed"
      );
    }

    const plan: PlanResult = {
      prompt:
        context.request.prompt,
      plan:
        result.output,
      plannedAt:
        new Date().toISOString(),
    };

    return {
      ...context,
      plan,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
