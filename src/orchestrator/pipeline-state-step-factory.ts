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

import {
  PIPELINE_FLOW,
} from "./pipeline-flow.js";

import {
  StateTransitionStep,
} from "./state-transition-step.js";

import {
  AnalysisStep,
} from "./analysis-step.js";

import {
  PlanningStep,
} from "./planning-step.js";

import {
  EnvironmentSetupStep,
} from "./environment-setup-step.js";

import {
  PlanValidationStep,
} from "./plan-validation-step.js";

import {
  CodingStep,
} from "./coding-step.js";

import {
  DatabaseSetupStep,
} from "./database-setup-step.js";

import {
  TestingStep,
} from "./testing-step.js";

import {
  ApplicationTestingStep,
} from "./application-testing-step.js";

import {
  ReviewStep,
} from "./review-step.js";

import {
  DecisionStep,
} from "./decision-step.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export interface PipelineStateStepFactoryOptions {
  agentService?: AgentService;

  planValidator?: PlanValidator;

  databaseManager?: DatabaseManager;

  testingService?: TestingService;

  applicationTestingService?:
    ApplicationTestingService;

  testPlan?: TestPlan;

  decisionEngine?: DecisionEngine;
}

export function createPipelineStateSteps(
  options: PipelineStateStepFactoryOptions = {}
): PipelineStep[] {
  const steps: PipelineStep[] = [];

  for (
    let index = 1;
    index < PIPELINE_FLOW.length;
    index += 1
  ) {
    const previousState =
      PIPELINE_FLOW[index - 1];

    const nextState =
      PIPELINE_FLOW[index];

    steps.push(
      new StateTransitionStep(
        `${previousState} -> ${nextState}`,
        nextState
      )
    );

    if (
      previousState === "STARTING" &&
      nextState === "ANALYZING"
    ) {
      steps.push(
        new AnalysisStep()
      );
    }

    if (
      previousState === "ANALYZING" &&
      nextState === "ENVIRONMENT_SETUP"
    ) {
      steps.push(
        new EnvironmentSetupStep()
      );
    }

    if (
      previousState === "ENVIRONMENT_SETUP" &&
      nextState === "PLANNING" &&
      options.agentService !== undefined
    ) {
      steps.push(
        new PlanningStep(
          options.agentService
        )
      );
    }

    if (
      previousState === "PLANNING" &&
      nextState === "PLAN_VALIDATING" &&
      options.planValidator !== undefined
    ) {
      steps.push(
        new PlanValidationStep(
          options.planValidator
        )
      );
    }

    if (
      previousState === "PLAN_VALIDATING" &&
      nextState === "CODING" &&
      options.agentService !== undefined
    ) {
      steps.push(
        new CodingStep(
          options.agentService
        )
      );
    }

    if (
      previousState === "CODING" &&
      nextState === "DATABASE_SETUP" &&
      options.databaseManager !== undefined
    ) {
      steps.push(
        new DatabaseSetupStep(
          options.databaseManager
        )
      );
    }

    if (
      previousState === "TESTING" &&
      nextState === "REVIEWING"
    ) {
      if (
        options.applicationTestingService !==
        undefined &&
        options.testPlan !==
        undefined
      ) {
        steps.push(
          new ApplicationTestingStep({
            applicationTestingService:
              options.applicationTestingService,

            testPlan:
              options.testPlan,
          })
        );
      } else if (
        options.testingService !==
        undefined &&
        options.testPlan !==
        undefined
      ) {
        steps.push(
          new TestingStep({
            testingService:
              options.testingService,

            testPlan:
              options.testPlan,
          })
        );
      }

      if (
        options.agentService !==
        undefined
      ) {
        steps.push(
          new ReviewStep({
            agentService:
              options.agentService,
          })
        );
      }
    }
  }

  if (
    options.decisionEngine !==
    undefined
  ) {
    steps.push(
      new DecisionStep({
        decisionEngine:
          options.decisionEngine,
      })
    );
  }

  return steps;
}
