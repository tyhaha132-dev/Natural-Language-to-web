import type {
  AgentService,
} from "../agents/agent-service.js";

import type {
  CodingResult,
} from "./coding-result.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

const CODING_RUNTIME_CONTRACT = [
  "Runtime requirements:",
  "- If you create a Node.js HTTP application, the server port MUST be read from process.env.PORT.",
  "- Do NOT hard-code the server port.",
  "- The application must listen on the port provided through process.env.PORT.",
  "- A local-development fallback port is allowed only when process.env.PORT is not set.",
  "- The application must expose an HTTP entrypoint that can be checked by the pipeline.",
].join("\n");

export class CodingStep
  implements PipelineStep
{
  readonly name = "code-project";

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
        "CodingStep requires a workspace"
      );
    }

    if (context.plan === null) {
      throw new Error(
        "CodingStep requires a plan"
      );
    }

    const prompt = [
      "Implement the project described by the user.",
      "",
      "User request:",
      context.request.prompt,
      "",
      "Validated implementation plan:",
      context.plan.plan,
      "",
      CODING_RUNTIME_CONTRACT,
    ].join("\n");

    const result =
      await this.agentService.run(
        "coder",
        {
          pipelineId:
            context.request.id,
          prompt,
          workspace:
            context.workspace,
        }
      );

    if (result.status !== "SUCCESS") {
      throw new Error(
        result.error ??
        "Coder agent failed"
      );
    }

    const codingResult:
      CodingResult = {
      output: result.output,
      codedAt:
        new Date().toISOString(),
    };

    return {
      ...context,
      codingResult,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
