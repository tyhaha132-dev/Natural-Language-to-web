import {
  createOpenCodeAgentExecutor,
} from "../agents/opencode-agent-executor.js";

import {
  createAgentFactory,
} from "../agents/agent-factory.js";

import {
  createAgentService,
} from "../agents/agent-service.js";

import {
  createPlanValidator,
} from "../planner/plan-validator.js";

import {
  createDatabaseManager,
} from "../infrastructure/database/database-manager.js";

import {
  createTestRunner,
} from "../testing/test-runner.js";

import {
  createTestingService,
} from "../testing/testing-service.js";

import type {
  TestPlan,
} from "../testing/test-plan.js";

import {
  createIterationManager,
} from "../orchestrator/iteration-manager.js";

import {
  createDecisionEngine,
} from "../orchestrator/decision-engine.js";

import {
  CONFIG,
} from "../config/config.js";

import {
  DefaultPipelineOrchestrator,
} from "../orchestrator/default-pipeline-orchestrator.js";

import type {
  PipelineOrchestrator,
} from "../orchestrator/pipeline-orchestrator.js";

export interface PipelineApplicationOptions {
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function createPipelineOrchestrator(
  options: PipelineApplicationOptions = {}
): PipelineOrchestrator {
  const processTimeoutMs =
    options.timeoutMs ??
    CONFIG.pipeline.processTimeoutMs;

  const executor =
    createOpenCodeAgentExecutor({
      timeoutMs:
        processTimeoutMs,
      env:
        options.env,
    });

  const factory =
    createAgentFactory(
      executor
    );

  const agentService =
    createAgentService(
      factory
    );

  const planValidator =
    createPlanValidator();

  const databaseManager =
    createDatabaseManager();

  const testRunner =
    createTestRunner({
      timeoutMs:
        processTimeoutMs,
      env:
        options.env,
    });

  const testingService =
    createTestingService(
      testRunner
    );

  const testPlan: TestPlan = {
    commands: [
      {
        command: "npm.cmd",
        args: ["test"],
      },
    ],
  };

  const iterationManager =
    createIterationManager({
      maxIterations:
        CONFIG.pipeline.maxIterations,
    });

  const decisionEngine =
    createDecisionEngine({
      iterationManager,
    });

  return new DefaultPipelineOrchestrator({
    agentService,
    planValidator,
    databaseManager,
    testingService,
    testPlan,
    decisionEngine,
    iterationManager,
  });
}
