import type { AgentService } from "../agents/agent-service.js";
import type { PipelineExecutionContext } from "./pipeline-execution-context.js";
import type { PipelineStep } from "./pipeline-step.js";
import { createReviewResult } from "./review-result.js";

export interface ReviewStepOptions {
  agentService: AgentService;
}

function parseReviewStatus(
  output: string
): "APPROVED" | "CHANGES_REQUIRED" {
  const firstLine =
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(
        (line) => line.length > 0
      ) ?? "";

  if (
    firstLine.toUpperCase() ===
    "APPROVED"
  ) {
    return "APPROVED";
  }

  return "CHANGES_REQUIRED";
}

function buildReviewPrompt(
  context: PipelineExecutionContext
): string {
  return [
    "You are the final code reviewer in an autonomous software engineering pipeline.",
    "",
    "Your job is ONLY to inspect and review the existing workspace.",
    "",
    "IMPORTANT RULES:",
    "- Do NOT ask the user any questions.",
    "- Do NOT request clarification.",
    "- Do NOT wait for user input.",
    "- Do NOT modify any files.",
    "- Do NOT create any files.",
    "- Do NOT run an interactive workflow.",
    "- Make the review decision yourself using the available evidence.",
    "",
    "Review the implementation against the original user request.",
    "",
    "Original user request:",
    context.request.prompt,
    "",
    "Review criteria:",
    "- Check whether the requested functionality is implemented.",
    "- Check whether the implementation is internally consistent.",
    "- Check for obvious correctness problems.",
    "- Check for obvious missing requirements.",
    "- Check the actual files in the workspace rather than assuming they are correct.",
    "",
    "If the validated implementation plan contains an Acceptance criteria section,",
    "verify the workspace against EACH criterion and report every criterion as",
    "PASS or FAIL with the file and line evidence.",
    "",
    "Required response format:",
    "Your response MUST start with exactly one verdict word on the first line:",
    "APPROVED or CHANGES_REQUIRED.",
    "",
    "After the verdict line, list a per-requirement checklist in this shape:",
    "- [PASS] <requirement>: <brief evidence>",
    "- [FAIL] <requirement>: <what is missing or wrong>",
    "",
    "If the implementation satisfies the request, the first line MUST be exactly:",
    "APPROVED",
    "",
    "If changes are required, the first line MUST be exactly:",
    "CHANGES_REQUIRED",
    "followed by the checklist with every FAIL item describing a concrete problem",
    "that must be fixed.",
    "",
    "Do not end by asking the user what to do next.",
    "Do not ask any questions.",
  ].join("\n");
}

export class ReviewStep implements PipelineStep {
  readonly name = "review";

  private readonly agentService: AgentService;

  constructor(options: ReviewStepOptions) {
    this.agentService = options.agentService;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    console.log(
      `[REVIEW_DEBUG] execute started for pipeline ${context.request.id}`
    );

    if (context.workspace === null) {
      throw new Error(
        "ReviewStep requires a workspace"
      );
    }

    if (context.codingResult === null) {
      throw new Error(
        "ReviewStep requires codingResult"
      );
    }

    console.log(
      `[REVIEW_DEBUG] workspace: ${context.workspace}`
    );

    const prompt =
      buildReviewPrompt(context);

    console.log(
      `[REVIEW_DEBUG] calling reviewer agent`
    );

    const result =
      await this.agentService.run(
        "reviewer",
        {
          pipelineId: context.request.id,
          prompt,
          workspace: context.workspace,
        }
      );

    console.log(
      `[REVIEW_DEBUG] reviewer agent returned`
    );

    console.log(
      `[REVIEW_DEBUG] status: ${result.status}`
    );

    console.log(
      `[REVIEW_DEBUG] output length: ${result.output.length}`
    );

    if (result.status !== "SUCCESS") {
      console.log(
        `[REVIEW_DEBUG] reviewer failed: ${result.error ?? "unknown error"}`
      );

      return {
        ...context,
        reviewResult: createReviewResult(
          result.output,
          "FAILED",
          result.error
            ? [result.error]
            : []
        ),
        updatedAt:
          new Date().toISOString(),
      };
    }

    const reviewStatus =
      parseReviewStatus(result.output);

    console.log(
      `[REVIEW_DEBUG] parsed review status: ${reviewStatus}`
    );

    return {
      ...context,
      reviewResult: createReviewResult(
        result.output,
        reviewStatus
      ),
      updatedAt:
        new Date().toISOString(),
    };
  }
}
