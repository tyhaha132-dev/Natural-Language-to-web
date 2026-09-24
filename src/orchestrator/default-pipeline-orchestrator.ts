import type {
  PipelineRequest,
} from "../contracts/pipeline.js";

import type {
  AgentService,
} from "../agents/agent-service.js";

import type {
  PlanValidator,
} from "../planner/plan-validator.js";

import type {
  DatabaseManager,
} from "../infrastructure/database/database-manager.js";

import type {
  TestingService,
} from "../testing/testing-service.js";

import type {
  ApplicationTestingService,
} from "../testing/application-testing-service.js";

import type {
  TestPlan,
} from "../testing/test-plan.js";

import type {
  DecisionEngine,
} from "./decision-engine.js";

import type {
  IterationManager,
} from "./iteration-manager.js";

import {
  createPipelineExecutionContext,
  type PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineOrchestrator,
} from "./pipeline-orchestrator.js";

import {
  createPipelineStepRunner,
  type PipelineStepRunner,
} from "./pipeline-step-runner.js";

import {
  NOOP_PIPELINE_STEP_OBSERVER,
  type PipelineStepObserver,
} from "./pipeline-step-observer.js";

import type {
  PipelineObserver,
} from "./pipeline-observer.js";

import {
  createPipelineLoggerObserver,
} from "./pipeline-logger-observer.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

import {
  createPipelineStateSteps,
} from "./pipeline-state-step-factory.js";

import type {
  PipelineRunResult,
} from "./pipeline-run-result.js";

export interface DefaultPipelineOrchestratorOptions {
  steps?: readonly PipelineStep[];

  stepRunner?: PipelineStepRunner;

  observer?: PipelineStepObserver;

  pipelineObserver?: PipelineObserver;

  agentService?: AgentService;

  planValidator?: PlanValidator;

  databaseManager?: DatabaseManager;

  testingService?: TestingService;

  applicationTestingService?:
    ApplicationTestingService;

  testPlan?: TestPlan;

  decisionEngine?: DecisionEngine;

  iterationManager?: IterationManager;
}

const MAX_RETRY_FEEDBACK_CHARS = 6000;

const MAX_FEEDBACK_SECTION_CHARS = 3000;

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

function buildRetryFeedback(
  context: PipelineExecutionContext
): string | null {
  const sections: string[] = [];

  const testResult =
    context.testResult;

  if (
    testResult !== null &&
    testResult.status === "FAILED"
  ) {
    const failures =
      testResult.results
        .filter(
          (result) =>
            result.status !==
            "PASSED"
        )
        .map((result) => {
          const command = [
            result.command,
            ...result.args,
          ].join(" ");

          const output = tail(
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
            1500
          );

          return [
            `Failing test command: ${command}`,
            `Exit code: ${result.exitCode ?? "unknown"}`,
            `Output:\n${output}`,
          ].join("\n");
        });

    if (failures.length > 0) {
      sections.push(
        [
          "Failing tests from the previous attempt:",
          ...failures,
        ].join("\n\n")
      );
    }
  }

  const reviewResult =
    context.reviewResult;

  if (
    reviewResult !== null &&
    reviewResult.status ===
      "CHANGES_REQUIRED" &&
    reviewResult.output.trim().length >
      0
  ) {
    sections.push(
      [
        "Reviewer feedback from the previous attempt:",
        tail(
          reviewResult.output.trim(),
          MAX_FEEDBACK_SECTION_CHARS
        ),
      ].join("\n")
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return [
    `Feedback from iteration ${context.iteration} (the previous attempt did not satisfy the request):`,
    ...sections,
  ].join("\n\n");
}

function appendRetryFeedback(
  previous: string | null,
  next: string | null
): string | null {
  if (next === null) {
    return previous;
  }

  const combined =
    previous === null
      ? next
      : `${previous}\n\n---\n\n${next}`;

  return tail(
    combined,
    MAX_RETRY_FEEDBACK_CHARS
  );
}

export class DefaultPipelineOrchestrator
  implements PipelineOrchestrator
{  private readonly steps:
    readonly PipelineStep[];

  private readonly stepRunner:
    PipelineStepRunner;

  private readonly pipelineObserver:
    PipelineObserver;

  private readonly decisionEngine:
    DecisionEngine | null;

  private readonly iterationManager:
    IterationManager | null;

  constructor(
    options: DefaultPipelineOrchestratorOptions = {}
  ) {
    this.steps =
      options.steps ??
      createPipelineStateSteps({
        agentService:
          options.agentService,

        planValidator:
          options.planValidator,

        databaseManager:
          options.databaseManager,

        testingService:
          options.testingService,

        applicationTestingService:
          options.applicationTestingService,

        testPlan:
          options.testPlan,

        decisionEngine:
          options.decisionEngine,
      });

    this.stepRunner =
      options.stepRunner ??
      createPipelineStepRunner({
        observer:
          options.observer ??
          NOOP_PIPELINE_STEP_OBSERVER,
      });

    this.pipelineObserver =
      options.pipelineObserver ??
      createPipelineLoggerObserver();

    this.decisionEngine =
      options.decisionEngine ?? null;

    this.iterationManager =
      options.iterationManager ?? null;
  }

  async execute(
    request: PipelineRequest
  ): Promise<PipelineRunResult> {
    const startTime = Date.now();

    let context:
      PipelineExecutionContext =
      createPipelineExecutionContext(
        request
      );

    this.pipelineObserver.onStart(
      context
    );

    try {
      if (
        this.decisionEngine === null
      ) {
        for (const step of this.steps) {
          const previousState =
            context.state;

          context =
            await this.stepRunner.run(
              step,
              context
            );

          if (
            previousState !==
            context.state
          ) {
            this.pipelineObserver.onStateChange(
              previousState,
              context
            );
          }
        }

        this.pipelineObserver.onComplete(
          context
        );

        return {
          status: "COMPLETED",
          context,
          durationMs:
            Date.now() - startTime,
        };
      }

      if (
        this.iterationManager === null
      ) {
        throw new Error(
          "DecisionEngine requires an IterationManager"
        );
      }

      let stepIndex = 0;

      while (
        stepIndex < this.steps.length
      ) {
        const step =
          this.steps[stepIndex];

        const previousState =
          context.state;

        context =
          await this.stepRunner.run(
            step,
            context
          );

        if (
          previousState !==
          context.state
        ) {
          this.pipelineObserver.onStateChange(
            previousState,
            context
          );
        }

        /*
         * Deterministic test failure path:
         *
         * TESTING FAILED
         *      ?
         * DECIDING
         *
         * ApplicationTestingStep intentionally uses
         * the same "run-tests" step name as the legacy
         * TestingStep, so both testing implementations
         * follow the same deterministic retry path.
         */
        if (
          step.name === "run-tests" &&
          context.testResult?.status ===
            "FAILED"
        ) {
          const decisionIndex =
            this.steps.findIndex(
              (candidate) =>
                candidate.name ===
                "decision"
            );

          if (decisionIndex === -1) {
            throw new Error(
              "Cannot handle test failure: decision step was not found"
            );
          }

          stepIndex =
            decisionIndex;

          continue;
        }

        if (
          step.name === "decision"
        ) {
          const decision =
            context.decisionResult;

          if (decision === null) {
            throw new Error(
              "Decision step completed without a decision result"
            );
          }

          if (
            decision.decision ===
            "COMPLETE"
          ) {
            const previousDecisionState =
              context.state;

            context = {
              ...context,

              state:
                "COMPLETED",

              updatedAt:
                new Date().toISOString(),
            };

            this.pipelineObserver.onStateChange(
              previousDecisionState,
              context
            );

            break;
          }

          if (
            decision.decision ===
            "FAIL"
          ) {
            throw new Error(
              decision.reason
            );
          }

          if (
            decision.decision ===
            "RETRY_REVIEW"
          ) {
            const nextIteration =
              this.iterationManager.next();

            const previousDecisionState =
              context.state;

            /*
             * Reviewer execution failure (crash or timeout):
             * the implementation and its test results are still
             * valid, so only the review step is retried.
             */
            context = {
              ...context,

              state:
                "REVIEWING",

              iteration:
                nextIteration,

              reviewResult:
                null,

              decisionResult:
                null,

              failureReason:
                null,

              retryFeedback:
                appendRetryFeedback(
                  context.retryFeedback,
                  `Feedback from iteration ${context.iteration}: the previous review attempt failed to execute (${decision.reason}). Re-review the same workspace.`
                ),

              updatedAt:
                new Date().toISOString(),
            };

            this.pipelineObserver.onStateChange(
              previousDecisionState,
              context
            );

            const reviewIndex =
              this.steps.findIndex(
                (candidate) =>
                  candidate.name ===
                  "review"
              );

            if (reviewIndex === -1) {
              throw new Error(
                "Cannot retry review: review step was not found"
              );
            }

            stepIndex =
              reviewIndex;

            continue;
          }

          const nextIteration =
            this.iterationManager.next();

          const previousDecisionState =
            context.state;

          const retryFeedback =
            appendRetryFeedback(
              context.retryFeedback,
              buildRetryFeedback(
                context
              )
            );

          context = {
            ...context,

            state:
              "CODING",

            iteration:
              nextIteration,

            codingResult:
              null,

            databaseResult:
              null,

            testResult:
              null,

            reviewResult:
              null,

            decisionResult:
              null,

            failureReason:
              null,

            retryFeedback,

            updatedAt:
              new Date().toISOString(),
          };

          this.pipelineObserver.onStateChange(
            previousDecisionState,
            context
          );

          const codingIndex =
            this.steps.findIndex(
              (candidate) =>
                candidate.name ===
                "code-project"
            );

          if (codingIndex === -1) {
            throw new Error(
              "Cannot retry pipeline: code-project step was not found"
            );
          }

          stepIndex =
            codingIndex;

          continue;
        }

        stepIndex += 1;
      }

      this.pipelineObserver.onComplete(
        context
      );

      return {
        status:
          "COMPLETED",

        context,

        durationMs:
          Date.now() - startTime,
      };
    } catch (error) {
      const failureReason =
        error instanceof Error
          ? error.message
          : String(error);

      const failedContext:
        PipelineExecutionContext = {
        ...context,

        state:
          "FAILED",

        failureReason,

        updatedAt:
          new Date().toISOString(),
      };

      this.pipelineObserver.onFailure(
        error,
        failedContext
      );

      return {
        status:
          "FAILED",

        context:
          failedContext,

        durationMs:
          Date.now() - startTime,
      };
    }
  }
}
