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
  "",
  "Agent environment and safety constraints:",
  "- The workspace runs on Windows with PowerShell. Use PowerShell-compatible commands only.",
  "- Do NOT use Linux shell syntax: VAR=value prefixes, & backgrounding, pkill, kill, curl, sleep, or %JOB% references.",
  "- NEVER stop or kill processes by name (Stop-Process without -Id, taskkill /IM, pkill, killall).",
  "- Killing processes by name can terminate the pipeline that invoked you and will fail the run.",
  "- If you start a background server for self-verification, stop ONLY that process by its PID and verify the port is free afterwards.",
  "- Broad process or port cleanup is handled by the pipeline; prefer leaving servers stopped over aggressive cleanup commands.",
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

    const promptParts = [
      "Implement the project described by the user.",
      "",
      "User request:",
      context.request.prompt,
      "",
      "Validated implementation plan:",
      context.plan.plan,
      "",
      CODING_RUNTIME_CONTRACT,
    ];

    if (
      context.iteration > 0 &&
      context.retryFeedback !== null
    ) {
      promptParts.push(
        "",
        "Feedback from previous attempt(s).",
        "The previous implementation did NOT satisfy the request.",
        "You MUST address every item below in this attempt.",
        "Do NOT repeat the same mistakes.",
        "",
        context.retryFeedback
      );
    }

    const prompt =
      promptParts.join("\n");

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
