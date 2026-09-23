import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  TestingStep,
} from "../src/orchestrator/testing-step.js";

import type {
  PipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

import type {
  TestingService,
} from "../src/testing/testing-service.js";

import type {
  TestPlan,
} from "../src/testing/test-plan.js";

function createContext(
  workspace: string | null
): PipelineExecutionContext {
  return {
    request: {
      id: "test-pipeline",
      prompt: "build a web app",
    },
    state: "TESTING",
    iteration: 0,
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

describe("TestingStep", () => {
  it("should run the test plan and store a passing result", async () => {
    const testingService:
      TestingService = {
      run: vi.fn().mockResolvedValue({
        status: "PASSED",
        results: [
          {
            status: "PASSED",
            command: "npm.cmd",
            args: ["test"],
            exitCode: 0,
            stdout: "passed",
            stderr: "",
            durationMs: 10,
          },
        ],
      }),
    };

    const testPlan: TestPlan = {
      commands: [
        {
          command: "npm.cmd",
          args: ["test"],
        },
      ],
    };

    const step =
      new TestingStep({
        testingService,
        testPlan,
      });

    const context =
      createContext(
        "C:\\workspace\\app"
      );

    const result =
      await step.execute(context);

    expect(
      testingService.run
    ).toHaveBeenCalledWith(
      "C:\\workspace\\app",
      testPlan.commands
    );

    expect(
      result.testResult?.status
    ).toBe("PASSED");
  });

  it("should store a failed result without throwing", async () => {
    const testingService:
      TestingService = {
      run: vi.fn().mockResolvedValue({
        status: "FAILED",
        results: [
          {
            status: "FAILED",
            command: "npm.cmd",
            args: ["test"],
            exitCode: 1,
            stdout: "",
            stderr: "test failed",
            durationMs: 20,
          },
        ],
      }),
    };

    const step =
      new TestingStep({
        testingService,
        testPlan: {
          commands: [
            {
              command: "npm.cmd",
              args: ["test"],
            },
          ],
        },
      });

    const result =
      await step.execute(
        createContext(
          "C:\\workspace\\app"
        )
      );

    expect(
      result.testResult?.status
    ).toBe("FAILED");

    expect(
      result.failureReason
    ).toBeNull();
  });

  it("should reject when workspace is missing", async () => {
    const testingService:
      TestingService = {
      run: vi.fn(),
    };

    const step =
      new TestingStep({
        testingService,
        testPlan: {
          commands: [],
        },
      });

    await expect(
      step.execute(
        createContext(null)
      )
    ).rejects.toThrow(
      "TestingStep requires a workspace"
    );

    expect(
      testingService.run
    ).not.toHaveBeenCalled();
  });
});
