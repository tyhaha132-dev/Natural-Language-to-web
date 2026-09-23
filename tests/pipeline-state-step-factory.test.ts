import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPipelineStateSteps,
} from "../src/orchestrator/pipeline-state-step-factory.js";

import type {
  AgentService,
} from "../src/agents/agent-service.js";

import type {
  AgentRole,
} from "../src/agents/agent-factory.js";

import type {
  AgentResult,
} from "../src/agents/agent-result.js";

import type {
  DatabaseManager,
} from "../src/infrastructure/database/database-manager.js";

import type {
  TestingService,
} from "../src/testing/testing-service.js";

import type {
  TestPlan,
} from "../src/testing/test-plan.js";

import type {
  DecisionEngine,
} from "../src/orchestrator/decision-engine.js";

import {
  createPlanValidator,
} from "../src/planner/plan-validator.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

function createMockDatabaseManager(): DatabaseManager {
  return {
    async connect(): Promise<void> {},

    async query() {
      return {
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        rows: [],
        fields: [],
      };
    },

    async transaction<T>(
      callback: (
        query: {
          query: DatabaseManager["query"];
        }
      ) => Promise<T>
    ): Promise<T> {
      return callback({
        query: async () => ({
          command: "SELECT",
          rowCount: 1,
          oid: 0,
          rows: [],
          fields: [],
        }),
      });
    },

    async health() {
      return {
        available: true,
        host: "localhost",
        port: 5432,
        database: "testdb",
        user: "postgres",
        error: null,
        durationMs: 1,
      };
    },

    async close(): Promise<void> {},
  };
}

function createMockTestingService(): TestingService {
  return {
    async run() {
      return {
        status: "PASSED",
        results: [
          {
            status: "PASSED",
            command: "npm.cmd",
            args: ["test"],
            exitCode: 0,
            stdout: "tests passed",
            stderr: "",
            durationMs: 1,
          },
        ],
      };
    },
  };
}

function createMockTestPlan(): TestPlan {
  return {
    commands: [
      {
        command: "npm.cmd",
        args: ["test"],
      },
    ],
  };
}

function createMockDecisionEngine(): DecisionEngine {
  return {
    decide() {
      return {
        decision: "COMPLETE",
        reason:
          "Tests passed and review approved",
        decidedAt:
          "2026-09-22T00:00:00.000Z",
      };
    },
  };
}

describe("PipelineStateStepFactory", () => {
  it("should create state transition steps plus analysis and environment setup", () => {
    const steps =
      createPipelineStateSteps();

    expect(steps).toHaveLength(11);

    expect(steps[0].name).toBe(
      "STARTING -> ANALYZING"
    );

    expect(steps[1].name).toBe(
      "analyze-request"
    );

    expect(steps[2].name).toBe(
      "ANALYZING -> ENVIRONMENT_SETUP"
    );

    expect(
      steps.some(
        (step) =>
          step.name === "setup-environment"
      )
    ).toBe(true);

    expect(
      steps.indexOf(
        steps.find(
          (step) =>
            step.name === "setup-environment"
        )!
      )
    ).toBe(3);
  });

  it("should add planning, coding, and review steps when agent service is provided", () => {
    const agentService: AgentService = {
      async run(
        _role: AgentRole,
        _input
      ): Promise<AgentResult> {
        return {
          status: "SUCCESS",
          output: "mock agent output",
          error: null,
          durationMs: 1,
        };
      },
    };

    const steps =
      createPipelineStateSteps({
        agentService,
      });

    expect(steps).toHaveLength(14);

    expect(
      steps.some(
        (step) =>
          step.name === "create-plan"
      )
    ).toBe(true);

    expect(
      steps.some(
        (step) =>
          step.name === "code-project"
      )
    ).toBe(true);

    expect(
      steps.some(
        (step) =>
          step.name === "review"
      )
    ).toBe(true);

    const reviewIndex =
      steps.findIndex(
        (step) =>
          step.name === "review"
      );

    expect(
      steps[reviewIndex - 1].name
    ).toBe(
      "TESTING -> REVIEWING"
    );
  });

  it("should add plan validation step when plan validator is provided", () => {
    const steps =
      createPipelineStateSteps({
        planValidator:
          createPlanValidator(),
      });

    expect(steps).toHaveLength(12);

    expect(
      steps.some(
        (step) =>
          step.name === "validate-plan"
      )
    ).toBe(true);

    const validationIndex =
      steps.findIndex(
        (step) =>
          step.name === "validate-plan"
      );

    expect(
      steps[validationIndex - 1].name
    ).toBe(
      "PLANNING -> PLAN_VALIDATING"
    );
  });

  it("should add database setup step when database manager is provided", () => {
    const steps =
      createPipelineStateSteps({
        databaseManager:
          createMockDatabaseManager(),
      });

    expect(steps).toHaveLength(12);

    expect(
      steps.some(
        (step) =>
          step.name === "setup-database"
      )
    ).toBe(true);

    const databaseIndex =
      steps.findIndex(
        (step) =>
          step.name === "setup-database"
      );

    expect(
      steps[databaseIndex - 1].name
    ).toBe(
      "CODING -> DATABASE_SETUP"
    );
  });

  it("should add testing step when testing dependencies are provided", () => {
    const steps =
      createPipelineStateSteps({
        testingService:
          createMockTestingService(),
        testPlan:
          createMockTestPlan(),
      });

    expect(steps).toHaveLength(12);

    expect(
      steps.some(
        (step) =>
          step.name === "run-tests"
      )
    ).toBe(true);

    const testingIndex =
      steps.findIndex(
        (step) =>
          step.name === "run-tests"
      );

    expect(
      steps[testingIndex - 1].name
    ).toBe(
      "TESTING -> REVIEWING"
    );
  });

  it("should add decision step when decision engine is provided", () => {
    const steps =
      createPipelineStateSteps({
        decisionEngine:
          createMockDecisionEngine(),
      });

    expect(steps).toHaveLength(12);

    expect(
      steps.some(
        (step) =>
          step.name === "decision"
      )
    ).toBe(true);

    const decisionIndex =
      steps.findIndex(
        (step) =>
          step.name === "decision"
      );

    expect(
      steps[decisionIndex - 1].name
    ).toBe(
      "REVIEWING -> DECIDING"
    );

    expect(
      decisionIndex
    ).toBe(
      steps.length - 1
    );
  });

  it("should execute the complete state flow with analysis", async () => {
    const steps =
      createPipelineStateSteps();

    let context =
      createPipelineExecutionContext({
        id: "factory-test-1",
        prompt: "Build a web app",
      });

    for (const step of steps) {
      context =
        await step.execute(context);
    }

    expect(context.state).toBe(
      "DECIDING"
    );

    expect(context.analysis).not.toBeNull();
    expect(context.workspace).not.toBeNull();
  });

  it("should execute planning, validation, coding, database setup, testing, and review when dependencies are provided", async () => {
    const agentService: AgentService = {
      async run(
        role: AgentRole,
        _input
      ): Promise<AgentResult> {
        if (role === "planner") {
          return {
            status: "SUCCESS",
            output: "mock plan",
            error: null,
            durationMs: 1,
          };
        }

        if (role === "coder") {
          return {
            status: "SUCCESS",
            output: "mock code generated",
            error: null,
            durationMs: 1,
          };
        }

        if (role === "reviewer") {
          return {
            status: "SUCCESS",
            output: "mock review completed",
            error: null,
            durationMs: 1,
          };
        }

        throw new Error(
          `Unexpected agent role: ${role}`
        );
      },
    };

    const testingService =
      createMockTestingService();

    const testPlan =
      createMockTestPlan();

    const steps =
      createPipelineStateSteps({
        agentService,
        planValidator:
          createPlanValidator(),
        databaseManager:
          createMockDatabaseManager(),
        testingService,
        testPlan,
      });

    let context =
      createPipelineExecutionContext({
        id: "factory-test-2",
        prompt: "Build a web app",
      });

    for (const step of steps) {
      context =
        await step.execute(context);
    }

    expect(context.state).toBe(
      "DECIDING"
    );

    expect(context.analysis).not.toBeNull();

    expect(context.plan).not.toBeNull();

    expect(
      context.plan?.plan
    ).toBe(
      "mock plan"
    );

    expect(
      context.codingResult
    ).not.toBeNull();

    expect(
      context.codingResult?.output
    ).toBe(
      "mock code generated"
    );

    expect(
      context.databaseResult
    ).not.toBeNull();

    expect(
      context.databaseResult?.available
    ).toBe(true);

    expect(
      context.databaseResult?.database
    ).toBe("testdb");

    expect(
      context.testResult
    ).not.toBeNull();

    expect(
      context.testResult?.status
    ).toBe("PASSED");

    expect(
      context.reviewResult
    ).not.toBeNull();

    expect(
      context.reviewResult?.status
    ).toBe("CHANGES_REQUIRED");

    expect(
      context.reviewResult?.output
    ).toBe(
      "mock review completed"
    );

    expect(
      context.workspace
    ).not.toBeNull();
  });

  it("should preserve pipeline request", async () => {
    const request = {
      id: "factory-test-3",
      prompt: "Build a CRUD app",
    };

    const steps =
      createPipelineStateSteps();

    let context =
      createPipelineExecutionContext(
        request
      );

    for (const step of steps) {
      context =
        await step.execute(context);
    }

    expect(
      context.request
    ).toEqual(
      request
    );
  });
});
