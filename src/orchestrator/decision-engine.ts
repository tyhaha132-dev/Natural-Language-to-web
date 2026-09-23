import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  DecisionResult,
} from "./decision-result.js";

import {
  createDecisionResult,
} from "./decision-result.js";

import type {
  IterationManager,
} from "./iteration-manager.js";

export interface DecisionEngine {
  decide(
    context: PipelineExecutionContext
  ): DecisionResult;
}

export interface DecisionEngineOptions {
  iterationManager: IterationManager;
}

export function createDecisionEngine(
  options: DecisionEngineOptions
): DecisionEngine {
  return {
    decide(
      context: PipelineExecutionContext
    ): DecisionResult {
      if (context.testResult === null) {
        return createDecisionResult(
          "FAIL",
          "No test result is available"
        );
      }

      const testFailed =
        context.testResult.status ===
          "FAILED";

      if (testFailed) {
        if (
          options.iterationManager
            .canContinue()
        ) {
          return createDecisionResult(
            "RETRY",
            "Tests failed and another iteration is available"
          );
        }

        return createDecisionResult(
          "FAIL",
          "Tests failed and maximum iterations have been reached"
        );
      }

      if (context.reviewResult === null) {
        return createDecisionResult(
          "FAIL",
          "No review result is available"
        );
      }

      if (
        context.reviewResult.status ===
        "FAILED"
      ) {
        return createDecisionResult(
          "FAIL",
          "Reviewer execution failed"
        );
      }

      if (
        context.reviewResult.status ===
        "APPROVED"
      ) {
        return createDecisionResult(
          "COMPLETE",
          "Tests passed and review approved"
        );
      }

      if (
        context.reviewResult.status ===
        "CHANGES_REQUIRED"
      ) {
        if (
          options.iterationManager
            .canContinue()
        ) {
          return createDecisionResult(
            "RETRY",
            "Reviewer requested changes and another iteration is available"
          );
        }

        return createDecisionResult(
          "FAIL",
          "Reviewer requested changes but maximum iterations have been reached"
        );
      }

      return createDecisionResult(
        "FAIL",
        "Unknown review status"
      );
    },
  };
}
