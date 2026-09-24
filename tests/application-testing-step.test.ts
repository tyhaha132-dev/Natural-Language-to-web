import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ApplicationTestingStep,
} from "../src/orchestrator/application-testing-step.js";

import type {
  ApplicationTestingService,
} from "../src/testing/application-testing-service.js";

import type {
  PipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

import type {
  TestPlan,
} from "../src/testing/test-plan.js";

function createContext(
  workspace: string | null
): PipelineExecutionContext {
  return {
    request: {
      id: "test-request",
      prompt: "test",
    },

    state: "TESTING",

    iteration: 1,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

    workspace,

    analysis: null,

    plan: null,

    codingResult: null,

    databaseResult: null,

    testResult: null,

    reviewResult: null,

    decisionResult: null,

    failureReason: null,
  };
}

function createTestPlan(): TestPlan {
  return {
    commands: [
      {
        command: "npm.cmd",
        args: [
          "test",
        ],
      },
    ],
  };
}

describe(
  "ApplicationTestingStep",
  () => {
    it(
      "should store a passed application test result",
      async () => {
        const applicationTestingService:
          ApplicationTestingService = {
          async run(
            workspace,
            commands
          ) {
            expect(
              workspace
            ).toBe(
              "C:\\workspace"
            );

            expect(
              commands
            ).toEqual(
              createTestPlan().commands
            );

            return {
              status:
                "PASSED",

              runtime:
                "STATIC",

              applicationStarted:
                true,

              url:
                "http://127.0.0.1:43127",

              error:
                null,
            };
          },
        };

        const step =
          new ApplicationTestingStep({
            applicationTestingService,

            testPlan:
              createTestPlan(),
          });

        const context =
          createContext(
            "C:\\workspace"
          );

        const result =
          await step.execute(
            context
          );

        expect(
          result.testResult
        ).not.toBeNull();

        expect(
          result.testResult?.status
        ).toBe(
          "PASSED"
        );

        expect(
          result.testResult?.results[0]?.status
        ).toBe(
          "PASSED"
        );

        expect(
          result.testResult?.results[0]?.args
        ).toEqual([
          "http://127.0.0.1:43127",
        ]);
      }
    );

    it(
      "should store a failed application test result",
      async () => {
        const applicationTestingService:
          ApplicationTestingService = {
          async run(
            workspace,
            commands
          ) {
            expect(
              workspace
            ).toBe(
              "C:\\workspace"
            );

            expect(
              commands
            ).toEqual(
              createTestPlan().commands
            );

            return {
              status:
                "FAILED",

              runtime:
                "STATIC",

              applicationStarted:
                true,

              url:
                "http://127.0.0.1:43127",

              error:
                "HTTP 500",
            };
          },
        };

        const step =
          new ApplicationTestingStep({
            applicationTestingService,

            testPlan:
              createTestPlan(),
          });

        const result =
          await step.execute(
            createContext(
              "C:\\workspace"
            )
          );

        expect(
          result.testResult?.status
        ).toBe(
          "FAILED"
        );

        expect(
          result.testResult?.results[0]?.status
        ).toBe(
          "FAILED"
        );

        expect(
          result.testResult?.results[0]?.stderr
        ).toContain(
          "HTTP 500"
        );
      }
    );

    it(
      "should reject a missing workspace",
      async () => {
        const applicationTestingService:
          ApplicationTestingService = {
          async run() {
            throw new Error(
              "should not be called"
            );
          },
        };

        const step =
          new ApplicationTestingStep({
            applicationTestingService,

            testPlan:
              createTestPlan(),
          });

        await expect(
          step.execute(
            createContext(null)
          )
        ).rejects.toThrow(
          "ApplicationTestingStep requires a workspace"
        );
      }
    );

    it(
      "should create a test result containing the application URL",
      async () => {
        const applicationTestingService:
          ApplicationTestingService = {
          async run(
            workspace,
            commands
          ) {
            expect(
              workspace
            ).toBe(
              "C:\\workspace"
            );

            expect(
              commands
            ).toEqual(
              createTestPlan().commands
            );

            return {
              status:
                "PASSED",

              runtime:
                "NODE",

              applicationStarted:
                true,

              url:
                "http://127.0.0.1:43128",

              error:
                null,
            };
          },
        };

        const step =
          new ApplicationTestingStep({
            applicationTestingService,

            testPlan:
              createTestPlan(),
          });

        const result =
          await step.execute(
            createContext(
              "C:\\workspace"
            )
          );

        expect(
          result.testResult?.results[0]?.args
        ).toEqual([
          "http://127.0.0.1:43128",
        ]);
      }
    );
  }
);
