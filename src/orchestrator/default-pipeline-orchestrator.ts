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
  testPlan?: TestPlan;
  decisionEngine?: DecisionEngine;
  iterationManager?: IterationManager;
}

export class DefaultPipelineOrchestrator
  implements PipelineOrchestrator
{
  private readonly steps:
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
         * The reviewer is an AI-based quality check.
         * When deterministic tests already fail, there is
         * no value in spending another reviewer call before
         * the DecisionEngine decides whether to retry.
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

          stepIndex = decisionIndex;
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
              state: "COMPLETED",
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

          const nextIteration =
            this.iterationManager.next();

          const previousDecisionState =
            context.state;

          context = {
            ...context,
            state: "CODING",
            iteration:
              nextIteration,
            codingResult: null,
            databaseResult: null,
            testResult: null,
            reviewResult: null,
            decisionResult: null,
            failureReason: null,
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

          stepIndex = codingIndex;
          continue;
        }

        stepIndex += 1;
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
    } catch (error) {
      const failureReason =
        error instanceof Error
          ? error.message
          : String(error);

      const failedContext:
        PipelineExecutionContext = {
        ...context,
        state: "FAILED",
        failureReason,
        updatedAt:
          new Date().toISOString(),
      };

      this.pipelineObserver.onFailure(
        error,
        failedContext
      );

      return {
        status: "FAILED",
        context: failedContext,
        durationMs:
          Date.now() - startTime,
      };
    }
  }
}
