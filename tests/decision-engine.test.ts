import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDecisionEngine,
} from "../src/orchestrator/decision-engine.js";

import {
  createIterationManager,
} from "../src/orchestrator/iteration-manager.js";

import type {
  PipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

function createContext(
  overrides: Partial<PipelineExecutionContext> = {}
): PipelineExecutionContext {
  const now =
    "2026-09-22T00:00:00.000Z";

  return {
    request: {
      id: "decision-test",
      prompt: "Build a web app",
    },
    state: "DECIDING",
    iteration: 1,
    createdAt: now,
    updatedAt: now,
    workspace: "C:\\workspace\\app",
    analysis: null,
    plan: null,
    codingResult: null,
    databaseResult: null,
    testResult: null,
    reviewResult: null,
    decisionResult: null,
    failureReason: null,
    retryFeedback: null,
    ...overrides,
  };
}

function createPassingTestResult() {
  return {
    status: "PASSED" as const,
    results: [
      {
        status: "PASSED" as const,
        command: "npm.cmd",
        args: ["test"],
        exitCode: 0,
        stdout: "passed",
        stderr: "",
        durationMs: 10,
      },
    ],
  };
}

function createFailedTestResult() {
  return {
    status: "FAILED" as const,
    results: [
      {
        status: "FAILED" as const,
        command: "npm.cmd",
        args: ["test"],
        exitCode: 1,
        stdout: "",
        stderr: "test failed",
        durationMs: 20,
      },
    ],
  };
}

function createReviewResult(
  status:
    | "APPROVED"
    | "CHANGES_REQUIRED"
    | "FAILED"
) {
  return {
    status,
    output: "review result",
    issues:
      status === "CHANGES_REQUIRED"
        ? ["Fix validation"]
        : [],
    reviewedAt:
      "2026-09-22T00:00:00.000Z",
  };
}

describe("DecisionEngine", () => {
  it("should fail when test result is missing", () => {
    const iterationManager =
      createIterationManager({
        maxIterations: 5,
      });

    const engine =
      createDecisionEngine({
        iterationManager,
      });

    const result =
      engine.decide(
        createContext()
      );

    expect(result.decision).toBe(
      "FAIL"
    );

    expect(result.reason).toBe(
      "No test result is available"
    );
  });

  it("should retry when tests fail and iterations remain", () => {
    const iterationManager =
      createIterationManager({
        maxIterations: 5,
      });

    const engine =
      createDecisionEngine({
        iterationManager,
      });

    const result =
      engine.decide(
        createContext({
          testResult:
            createFailedTestResult(),
        })
      );

    expect(result.decision).toBe(
      "RETRY"
    );
  });

  it("should fail when tests fail and iterations are exhausted", () => {
    const iterationManager =
      createIterationManager({
        maxIterations: 1,
      });

    iterationManager.next();

    const engine =
      createDecisionEngine({
        iterationManager,
      });

    const result =
      engine.decide(
        createContext({
          testResult:
            createFailedTestResult(),
        })
      );

    expect(result.decision).toBe(
      "FAIL"
    );

    expect(result.reason).toContain(
      "maximum iterations"
    );
  });

  it("should fail when reviewer execution failed", () => {
    const iterationManager =
      createIterationManager({
        maxIterations: 5,
      });

    const engine =
      createDecisionEngine({
        iterationManager,
      });

    const result =
      engine.decide(
        createContext({
          testResult:
            createPassingTestResult(),
          reviewResult:
            createReviewResult(
              "FAILED"
            ),
        })
      );

    expect(result.decision).toBe(
      "FAIL"
    );

    expect(result.reason).toBe(
      "Reviewer execution failed"
    );
  });

  it("should complete when tests pass and review is approved", () => {
    const iterationManager =
      createIterationManager({
        maxIterations: 5,
      });

    const engine =
      createDecisionEngine({
        iterationManager,
      });

    const result =
      engine.decide(
        createContext({
          testResult:
            createPassingTestResult(),
          reviewResult:
            createReviewResult(
              "APPROVED"
            ),
        })
      );

    expect(result.decision).toBe(
      "COMPLETE"
    );

    expect(result.reason).toBe(
      "Tests passed and review approved"
    );
  });

  it("should retry when reviewer requests changes and iterations remain", () => {
    const iterationManager =
      createIterationManager({
        maxIterations: 5,
      });

    const engine =
      createDecisionEngine({
        iterationManager,
      });

    const result =
      engine.decide(
        createContext({
          testResult:
            createPassingTestResult(),
          reviewResult:
            createReviewResult(
              "CHANGES_REQUIRED"
            ),
        })
      );

    expect(result.decision).toBe(
      "RETRY"
    );
  });

  it("should fail when reviewer requests changes and iterations are exhausted", () => {
    const iterationManager =
      createIterationManager({
        maxIterations: 1,
      });

    iterationManager.next();

    const engine =
      createDecisionEngine({
        iterationManager,
      });

    const result =
      engine.decide(
        createContext({
          testResult:
            createPassingTestResult(),
          reviewResult:
            createReviewResult(
              "CHANGES_REQUIRED"
            ),
        })
      );

    expect(result.decision).toBe(
      "FAIL"
    );

    expect(result.reason).toContain(
      "maximum iterations"
    );
  });
});
