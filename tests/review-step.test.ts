import { describe, expect, it } from "vitest";

import type {
  AgentInput,
} from "../src/agents/agent-contract.js";

import type {
  AgentResult,
} from "../src/agents/agent-result.js";

import type {
  AgentService,
} from "../src/agents/agent-service.js";

import {
  ReviewStep,
} from "../src/orchestrator/review-step.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

function createAgentService(
  result: AgentResult
): AgentService {
  return {
    async run(
      role,
      input: AgentInput
    ): Promise<AgentResult> {
      expect(role).toBe("reviewer");

      expect(
        input.pipelineId
      ).toBe("pipeline-1");

      expect(
        input.workspace
      ).toBe(
        "workspace/pipeline-1"
      );

      expect(
        input.prompt
      ).toContain(
        "Original user request:"
      );

      expect(
        input.prompt
      ).toContain(
        "build student app"
      );

      expect(
        input.prompt
      ).toContain(
        "Do NOT ask the user any questions."
      );

      expect(
        input.prompt
      ).toContain(
        "Do NOT modify any files."
      );

      expect(
        input.prompt
      ).toContain(
        "APPROVED"
      );

      expect(
        input.prompt
      ).toContain(
        "CHANGES_REQUIRED"
      );

      return result;
    },
  };
}

function createContext() {
  const context =
    createPipelineExecutionContext({
      id: "pipeline-1",
      prompt: "build student app",
    });

  return {
    ...context,
    workspace:
      "workspace/pipeline-1",
    codingResult: {
      output: "coding completed",
      codedAt:
        new Date().toISOString(),
    },
  };
}

describe("ReviewStep", () => {
  it("creates a successful review result", async () => {
    const step =
      new ReviewStep({
        agentService:
          createAgentService({
            status: "SUCCESS",
            output:
              "Code review completed",
            error: null,
            durationMs: 100,
          }),
      });

    const result =
      await step.execute(
        createContext()
      );

    expect(
      result.reviewResult
    ).not.toBeNull();

    expect(
      result.reviewResult?.status
    ).toBe("CHANGES_REQUIRED");

    expect(
      result.reviewResult?.output
    ).toBe(
      "Code review completed"
    );

    expect(
      result.reviewResult?.issues
    ).toEqual([]);
  });

  it("stores reviewer failure", async () => {
    const step =
      new ReviewStep({
        agentService:
          createAgentService({
            status: "FAILURE",
            output: "",
            error:
              "Reviewer process failed",
            durationMs: 100,
          }),
      });

    const result =
      await step.execute(
        createContext()
      );

    expect(
      result.reviewResult?.status
    ).toBe("FAILED");

    expect(
      result.reviewResult?.issues
    ).toEqual([
      "Reviewer process failed",
    ]);
  });

  it("requires a workspace", async () => {
    const step =
      new ReviewStep({
        agentService:
          createAgentService({
            status: "SUCCESS",
            output: "review",
            error: null,
            durationMs: 100,
          }),
      });

    const context = {
      ...createContext(),
      workspace: null,
    };

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "ReviewStep requires a workspace"
    );
  });

  it("requires codingResult", async () => {
    const step =
      new ReviewStep({
        agentService:
          createAgentService({
            status: "SUCCESS",
            output: "review",
            error: null,
            durationMs: 100,
          }),
      });

    const context = {
      ...createContext(),
      codingResult: null,
    };

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "ReviewStep requires codingResult"
    );
  });

  it("approves when the first line is APPROVED followed by a checklist", async () => {
    const step =
      new ReviewStep({
        agentService:
          createAgentService({
            status: "SUCCESS",
            output: [
              "APPROVED",
              "- [PASS] Student list page: renders table in index.html:12",
              "- [PASS] Create form: posts to /api/students in app.js:40",
            ].join("\n"),
            error: null,
            durationMs: 100,
          }),
      });

    const result =
      await step.execute(
        createContext()
      );

    expect(
      result.reviewResult?.status
    ).toBe("APPROVED");
  });

  it("requests changes when the first line is CHANGES_REQUIRED with FAIL items", async () => {
    const output = [
      "CHANGES_REQUIRED",
      "- [PASS] Student list page: renders table in index.html:12",
      "- [FAIL] Delete action: no DELETE handler found in workspace",
    ].join("\n");

    const step =
      new ReviewStep({
        agentService:
          createAgentService({
            status: "SUCCESS",
            output,
            error: null,
            durationMs: 100,
          }),
      });

    const result =
      await step.execute(
        createContext()
      );

    expect(
      result.reviewResult?.status
    ).toBe("CHANGES_REQUIRED");

    expect(
      result.reviewResult?.output
    ).toBe(output);
  });
});
