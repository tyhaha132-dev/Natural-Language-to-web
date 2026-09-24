import { promises as fs } from "node:fs";

import path from "node:path";

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

const MAX_TREE_ENTRIES = 100;

const MAX_TREE_DEPTH = 3;

const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
]);

async function collectTreeEntries(
  directory: string,
  prefix: string,
  depth: number,
  entries: string[]
): Promise<void> {
  if (
    depth > MAX_TREE_DEPTH ||
    entries.length >=
      MAX_TREE_ENTRIES
  ) {
    return;
  }

  let children;
  try {
    children = await fs.readdir(
      directory,
      { withFileTypes: true }
    );
  } catch {
    return;
  }

  children.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const child of children) {
    if (
      entries.length >=
      MAX_TREE_ENTRIES
    ) {
      break;
    }

    const displayName =
      child.isDirectory()
        ? `${child.name}/`
        : child.name;

    entries.push(
      `${prefix}${displayName}`
    );

    if (
      child.isDirectory() &&
      !SKIPPED_DIRECTORIES.has(
        child.name
      )
    ) {
      await collectTreeEntries(
        path.join(
          directory,
          child.name
        ),
        `${prefix}${child.name}/`,
        depth + 1,
        entries
      );
    }
  }
}

async function buildWorkspaceTree(
  workspace: string
): Promise<string> {
  const entries: string[] = [];

  await collectTreeEntries(
    workspace,
    "",
    0,
    entries
  );

  if (entries.length === 0) {
    return "(workspace is empty or unreadable)";
  }

  const truncated =
    entries.length >=
    MAX_TREE_ENTRIES
      ? "\n...(truncated, further entries omitted)"
      : "";

  return (
    entries.join("\n") +
    truncated
  );
}

function tail(
  text: string,
  maxChars: number
): string {
  if (text.length <= maxChars) {
    return text;
  }

  return (
    "...[truncated]...\n" +
    text.slice(-maxChars)
  );
}

function buildTestSummary(
  context: PipelineExecutionContext
): string {
  const testResult =
    context.testResult;

  if (testResult === null) {
    return "No test result is available.";
  }

  const lines = [
    `Overall test status: ${testResult.status}`,
  ];

  for (const result of testResult.results) {
    if (
      result.status ===
      "PASSED"
    ) {
      continue;
    }

    lines.push(
      [
        `Failing check: ${result.command} ${result.args.join(" ")}`,
        tail(
          [
            result.stderr,
            result.stdout,
          ]
            .filter(
              (part) =>
                part.trim().length >
                0
            )
            .join("\n"),
          800
        ),
      ].join("\n")
    );
  }

  return lines.join("\n\n");
}

async function buildReviewPrompt(
  context: PipelineExecutionContext
): Promise<string> {
  const workspaceTree =
    context.workspace === null
      ? "(no workspace)"
      : await buildWorkspaceTree(
          context.workspace
        );

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
    "TIME BUDGET:",
    "- You operate under a strict time limit.",
    "- Read AT MOST 10 files. Start with the entry points below, then decide.",
    "- Do NOT read every file in the workspace.",
    "- Do NOT run servers, install packages, or execute long commands.",
    "- Inspect the key files, verify the checklist, then emit your verdict immediately.",
    "",
    "Workspace file tree (node_modules, .git and build output omitted):",
    workspaceTree,
    "",
    "Latest test summary:",
    buildTestSummary(context),
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
      await buildReviewPrompt(
        context
      );

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
