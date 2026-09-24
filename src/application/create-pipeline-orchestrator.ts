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
  createApplicationTestRunner,
} from "../testing/application-test-runner-impl.js";

import {
  createHttpSmokeTester,
} from "../testing/http-smoke-test.js";

import {
  createApplicationTestingService,
} from "../testing/application-testing-service.js";

import {
  createApplicationServerFactory,
} from "../runtime/application-server-factory.js";

import {
  createRuntimeDiscovery,
} from "../runtime/runtime-discovery.js";

import {
  createNodeStartCommandResolver,
} from "../runtime/node-start-command-resolver.js";

import {
  createApplicationServerResolver,
} from "../runtime/application-server-resolver.js";

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

  /*
   * Legacy deterministic testing service.
   *
   * Kept for backwards compatibility with the
   * existing Layer 8/9 testing architecture.
   */
  const testingService =
    createTestingService(
      testRunner
    );

  /*
   * Test plan used by Node applications.
   *
   * Static applications ignore these commands and
   * use the HTTP smoke test instead.
   */
  const testPlan: TestPlan = {
    commands: [
      {
        command:
          process.platform ===
          "win32"
            ? "npm.cmd"
            : "npm",

        args: [
          "test",
        ],
      },
    ],
  };

  /*
   * Application runtime discovery.
   *
   * package.json -> NODE runtime
   * index.html   -> STATIC runtime
   */
  const nodeStartCommandResolver =
    createNodeStartCommandResolver();

  const runtimeDiscovery =
    createRuntimeDiscovery(
      nodeStartCommandResolver
    );

  /*
   * Application server factory.
   *
   * A single configured application port is
   * currently used for the benchmark pipeline.
   */
  const applicationServerFactory =
    createApplicationServerFactory({
      port:
        CONFIG.server.applicationPort,

      readinessTimeoutMs:
        CONFIG.server.readinessTimeoutMs,

      readinessIntervalMs:
        CONFIG.server.readinessIntervalMs,

      env:
        options.env,
    });

  const applicationServerResolver =
    createApplicationServerResolver(
      runtimeDiscovery,
      applicationServerFactory
    );

  /*
   * Application-level test runner.
   *
   * NODE applications:
   *   start server
   *   run npm test
   *   stop server
   *
   * STATIC applications:
   *   handled by HttpSmokeTester below
   */
  const applicationTestRunner =
    createApplicationTestRunner({
      testRunner,
    });

  const httpSmokeTester =
    createHttpSmokeTester();

  const applicationTestingService =
    createApplicationTestingService({
      applicationServerResolver,

      applicationTestRunner,

      httpSmokeTester,

      testRunner,
    });

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

    /*
     * Legacy service retained for callers/tests that
     * still construct the old testing path.
     */
    testingService,

    /*
     * Runtime-aware application testing is the
     * actual pipeline testing implementation.
     */
    applicationTestingService,

    testPlan,

    decisionEngine,

    iterationManager,
  });
}
