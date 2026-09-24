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

function buildPlanningPrompt(
  userRequest: string
): string {
  return [
    "You are the planning agent in an autonomous software engineering pipeline.",
    "",
    "Your ONLY job is to analyze the user's request and produce an implementation plan.",
    "",
    "STRICT RULES:",
    "- Do NOT modify any files.",
    "- Do NOT create any files.",
    "- Do NOT delete any files.",
    "- Do NOT run npm commands.",
    "- Do NOT run shell commands.",
    "- Do NOT start any server.",
    "- Do NOT install packages.",
    "- Do NOT execute the implementation.",
    "- Do NOT ask the user questions.",
    "- Do NOT request clarification.",
    "- Do NOT wait for user input.",
    "",
    "The workspace is provided only so you can understand the existing project structure.",
    "Treat the workspace as READ-ONLY during this step.",
    "",
    "Produce a concise but complete implementation plan for the coder agent.",
    "",
    "The plan should identify:",
    "1. Required functionality.",
    "2. Frontend changes.",
    "3. Backend/API changes.",
    "4. Database changes if needed.",
    "5. Validation and error-handling requirements.",
    "6. Testing requirements.",
    "7. Important runtime requirements.",
    "8. Assumptions made. The user cannot be asked for clarification, so state every",
    "   significant assumption explicitly instead of leaving it implicit.",
    "9. Acceptance criteria. A numbered, checkable list that a reviewer can verify",
    "   against the finished workspace (each item must be objectively pass/fail).",
    "",
    "Structure the plan with these exact section headings so downstream steps can rely on them:",
    "Required functionality, Frontend, Backend/API, Database, Validation and error handling,",
    "Testing, Runtime requirements, Assumptions, Acceptance criteria.",
    "",
    "Do not implement anything.",
    "",
    "USER REQUEST:",
    userRequest,
    "",
    "Return only the implementation plan.",
  ].join("\n");
}

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

    const prompt =
      buildPlanningPrompt(
        context.request.prompt
      );

    const result =
      await this.agentService.run(
        "planner",
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
