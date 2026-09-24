import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DefaultPipelineOrchestrator,
} from "../src/orchestrator/default-pipeline-orchestrator.js";

import type {
  AgentService,
} from "../src/agents/agent-service.js";

import type {
  TestingService,
} from "../src/testing/testing-service.js";

import type {
  TestPlan,
} from "../src/testing/test-plan.js";

import {
  createDecisionEngine,
} from "../src/orchestrator/decision-engine.js";

import {
  createIterationManager,
} from "../src/orchestrator/iteration-manager.js";

function createTestPlan(): TestPlan {
  return {
    commands: [
      {
        command: "npm.cmd",
        args: ["test"],
      },
    ],
  };
}

function createAlwaysFailingTestingService(
  testRuns: () => void
): TestingService {
  return {
    async run() {
      testRuns();

      return {
        status: "FAILED",
        results: [
          {
            status: "FAILED",
            command: "npm.cmd",
            args: ["test"],
            exitCode: 1,
            stdout: "",
            stderr: "tests always fail",
            durationMs: 1,
          },
        ],
      };
    },
  };
}

describe(
  "DefaultPipelineOrchestrator retry flow",
  () => {
    it(
      "should retry coding, testing, and review without rerunning planning when tests fail",
      async () => {
        const calls: string[] = [];

        const agentService: AgentService = {
          async run(
            role,
            input
          ) {
            calls.push(
              `${role}:${input.pipelineId}`
            );

            if (role === "planner") {
              return {
                status: "SUCCESS",
                output: "PLAN",
                error: null,
                durationMs: 0,
              };
            }

            if (role === "coder") {
              return {
                status: "SUCCESS",
                output: "CODE",
                error: null,
                durationMs: 0,
              };
            }

            return {
              status: "SUCCESS",
              output: "APPROVED",
              error: null,
              durationMs: 0,
            };
          },
        };

        let testRuns = 0;

        const testingService: TestingService = {
          async run() {
            testRuns += 1;

            if (testRuns === 1) {
              return {
                status: "FAILED",
                results: [
                  {
                    status: "FAILED",
                    command: "npm.cmd",
                    args: ["test"],
                    exitCode: 1,
                    stdout: "",
                    stderr: "first run failed",
                    durationMs: 1,
                  },
                ],
              };
            }

            return {
              status: "PASSED",
              results: [
                {
                  status: "PASSED",
                  command: "npm.cmd",
                  args: ["test"],
                  exitCode: 0,
                  stdout: "passed",
                  stderr: "",
                  durationMs: 1,
                },
              ],
            };
          },
        };

        const iterationManager =
          createIterationManager({
            maxIterations: 5,
          });

        const decisionEngine =
          createDecisionEngine({
            iterationManager,
          });

        const orchestrator =
          new DefaultPipelineOrchestrator({
            agentService,
            testingService,
            testPlan:
              createTestPlan(),
            decisionEngine,
            iterationManager,
          });

        const result =
          await orchestrator.execute({
            id: "retry-test-1",
            prompt: "Build a student app",
          });

        expect(result.status).toBe(
          "COMPLETED"
        );

        expect(
          result.context.iteration
        ).toBe(1);

        expect(
          result.context.testResult?.status
        ).toBe("PASSED");

        expect(
          result.context.decisionResult?.decision
        ).toBe("COMPLETE");

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "planner:"
              )
          )
        ).toHaveLength(1);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "coder:"
              )
          )
        ).toHaveLength(2);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "reviewer:"
              )
          )
        ).toHaveLength(1);

        expect(testRuns).toBe(2);
      }
    );

    it(
      "should skip reviewer when tests fail",
      async () => {
        const calls: string[] = [];
        let testRuns = 0;

        const agentService: AgentService = {
          async run(
            role,
            input
          ) {
            calls.push(
              `${role}:${input.pipelineId}`
            );

            if (role === "planner") {
              return {
                status: "SUCCESS",
                output: "PLAN",
                error: null,
                durationMs: 0,
              };
            }

            if (role === "coder") {
              return {
                status: "SUCCESS",
                output: "CODE",
                error: null,
                durationMs: 0,
              };
            }

            return {
              status: "SUCCESS",
              output: "APPROVED",
              error: null,
              durationMs: 0,
            };
          },
        };

        const testingService: TestingService = {
          async run() {
            testRuns += 1;

            return {
              status: "FAILED",
              results: [
                {
                  status: "FAILED",
                  command: "npm.cmd",
                  args: ["test"],
                  exitCode: 1,
                  stdout: "",
                  stderr: "tests failed",
                  durationMs: 1,
                },
              ],
            };
          },
        };

        const iterationManager =
          createIterationManager({
            maxIterations: 1,
          });

        const decisionEngine =
          createDecisionEngine({
            iterationManager,
          });

        const orchestrator =
          new DefaultPipelineOrchestrator({
            agentService,
            testingService,
            testPlan:
              createTestPlan(),
            decisionEngine,
            iterationManager,
          });

        const result =
          await orchestrator.execute({
            id: "skip-reviewer-test",
            prompt: "Build a student app",
          });

        expect(result.status).toBe(
          "FAILED"
        );

        expect(testRuns).toBe(2);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "reviewer:"
              )
          )
        ).toHaveLength(0);
      }
    );

    it(
      "should retry when reviewer requests changes and then complete when reviewer approves",
      async () => {
        const calls: string[] = [];
        let reviewerRuns = 0;
        let testRuns = 0;

        const agentService: AgentService = {
          async run(
            role,
            input
          ) {
            calls.push(
              `${role}:${input.pipelineId}`
            );

            if (role === "planner") {
              return {
                status: "SUCCESS",
                output: "PLAN",
                error: null,
                durationMs: 0,
              };
            }

            if (role === "coder") {
              return {
                status: "SUCCESS",
                output: "CODE",
                error: null,
                durationMs: 0,
              };
            }

            reviewerRuns += 1;

            if (reviewerRuns === 1) {
              return {
                status: "SUCCESS",
                output: "CHANGES_REQUIRED",
                error: null,
                durationMs: 0,
              };
            }

            return {
              status: "SUCCESS",
              output: "APPROVED",
              error: null,
              durationMs: 0,
            };
          },
        };

        const testingService =
          {
            async run() {
              testRuns += 1;

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
                    durationMs: 1,
                  },
                ],
              };
            },
          } satisfies TestingService;

        const iterationManager =
          createIterationManager({
            maxIterations: 5,
          });

        const decisionEngine =
          createDecisionEngine({
            iterationManager,
          });

        const orchestrator =
          new DefaultPipelineOrchestrator({
            agentService,
            testingService,
            testPlan:
              createTestPlan(),
            decisionEngine,
            iterationManager,
          });

        const result =
          await orchestrator.execute({
            id: "retry-test-2",
            prompt: "Build a student app",
          });

        expect(result.status).toBe(
          "COMPLETED"
        );

        expect(
          result.context.iteration
        ).toBe(1);

        expect(
          result.context.testResult?.status
        ).toBe("PASSED");

        expect(
          result.context.reviewResult?.status
        ).toBe("APPROVED");

        expect(
          result.context.decisionResult?.decision
        ).toBe("COMPLETE");

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "planner:"
              )
          )
        ).toHaveLength(1);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "coder:"
              )
          )
        ).toHaveLength(2);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "reviewer:"
              )
          )
        ).toHaveLength(2);

        expect(testRuns).toBe(2);

        expect(reviewerRuns).toBe(2);
      }
    );

    it(
      "should fail after reaching the maximum retry limit",
      async () => {
        const calls: string[] = [];
        let testRuns = 0;

        const agentService: AgentService = {
          async run(
            role,
            input
          ) {
            calls.push(
              `${role}:${input.pipelineId}`
            );

            if (role === "planner") {
              return {
                status: "SUCCESS",
                output: "PLAN",
                error: null,
                durationMs: 0,
              };
            }

            if (role === "coder") {
              return {
                status: "SUCCESS",
                output: "CODE",
                error: null,
                durationMs: 0,
              };
            }

            return {
              status: "SUCCESS",
              output: "APPROVED",
              error: null,
              durationMs: 0,
            };
          },
        };

        const testingService =
          createAlwaysFailingTestingService(
            () => {
              testRuns += 1;
            }
          );

        const iterationManager =
          createIterationManager({
            maxIterations: 2,
          });

        const decisionEngine =
          createDecisionEngine({
            iterationManager,
          });

        const orchestrator =
          new DefaultPipelineOrchestrator({
            agentService,
            testingService,
            testPlan:
              createTestPlan(),
            decisionEngine,
            iterationManager,
          });

        const result =
          await orchestrator.execute({
            id: "retry-limit-test",
            prompt: "Build a student app",
          });

        expect(result.status).toBe(
          "FAILED"
        );

        expect(
          result.context.state
        ).toBe("FAILED");

        expect(
          result.context.failureReason
        ).toContain(
          "maximum iterations"
        );

        expect(
          result.context.iteration
        ).toBe(2);

        expect(testRuns).toBe(3);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "planner:"
              )
          )
        ).toHaveLength(1);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "coder:"
              )
          )
        ).toHaveLength(3);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "reviewer:"
              )
          )
        ).toHaveLength(0);
      }
    );

    it(
      "should pass previous test failures to the coder on retry",
      async () => {
        const coderPrompts: string[] = [];
        let testRuns = 0;

        const agentService: AgentService = {
          async run(
            role,
            input
          ) {
            if (role === "coder") {
              coderPrompts.push(
                input.prompt
              );

              return {
                status: "SUCCESS",
                output: "CODE",
                error: null,
                durationMs: 0,
              };
            }

            if (role === "planner") {
              return {
                status: "SUCCESS",
                output: "PLAN",
                error: null,
                durationMs: 0,
              };
            }

            return {
              status: "SUCCESS",
              output: "APPROVED",
              error: null,
              durationMs: 0,
            };
          },
        };

        const testingService: TestingService = {
          async run() {
            testRuns += 1;

            if (testRuns === 1) {
              return {
                status: "FAILED",
                results: [
                  {
                    status: "FAILED",
                    command: "npm.cmd",
                    args: ["test"],
                    exitCode: 1,
                    stdout: "",
                    stderr:
                      "AssertionError: missing email validation",
                    durationMs: 1,
                  },
                ],
              };
            }

            return {
              status: "PASSED",
              results: [
                {
                  status: "PASSED",
                  command: "npm.cmd",
                  args: ["test"],
                  exitCode: 0,
                  stdout: "passed",
                  stderr: "",
                  durationMs: 1,
                },
              ],
            };
          },
        };

        const iterationManager =
          createIterationManager({
            maxIterations: 5,
          });

        const decisionEngine =
          createDecisionEngine({
            iterationManager,
          });

        const orchestrator =
          new DefaultPipelineOrchestrator({
            agentService,
            testingService,
            testPlan:
              createTestPlan(),
            decisionEngine,
            iterationManager,
          });

        const result =
          await orchestrator.execute({
            id: "retry-feedback-test",
            prompt: "Build a student app",
          });

        expect(result.status).toBe(
          "COMPLETED"
        );

        expect(
          coderPrompts
        ).toHaveLength(2);

        expect(
          coderPrompts[0]
        ).not.toContain(
          "Feedback from previous attempt(s)."
        );

        expect(
          coderPrompts[1]
        ).toContain(
          "Feedback from previous attempt(s)."
        );

        expect(
          coderPrompts[1]
        ).toContain(
          "missing email validation"
        );
      }
    );

    it(
      "should retry only the review step when reviewer execution fails",
      async () => {
        const calls: string[] = [];
        let reviewerRuns = 0;

        const agentService: AgentService = {
          async run(
            role,
            input
          ) {
            calls.push(
              `${role}:${input.pipelineId}`
            );

            if (role === "planner") {
              return {
                status: "SUCCESS",
                output: "PLAN",
                error: null,
                durationMs: 0,
              };
            }

            if (role === "coder") {
              return {
                status: "SUCCESS",
                output: "CODE",
                error: null,
                durationMs: 0,
              };
            }

            reviewerRuns += 1;

            if (reviewerRuns === 1) {
              return {
                status: "FAILURE",
                output: "",
                error:
                  "Reviewer process timed out",
                durationMs: 0,
              };
            }

            return {
              status: "SUCCESS",
              output: "APPROVED",
              error: null,
              durationMs: 0,
            };
          },
        };

        const testingService: TestingService = {
          async run() {
            return {
              status: "PASSED",
              results: [
                {
                  status: "PASSED",
                  command: "npm.cmd",
                  args: ["test"],
                  exitCode: 0,
                  stdout: "passed",
                  stderr: "",
                  durationMs: 1,
                },
              ],
            };
          },
        };

        const iterationManager =
          createIterationManager({
            maxIterations: 5,
          });

        const decisionEngine =
          createDecisionEngine({
            iterationManager,
          });

        const orchestrator =
          new DefaultPipelineOrchestrator({
            agentService,
            testingService,
            testPlan:
              createTestPlan(),
            decisionEngine,
            iterationManager,
          });

        const result =
          await orchestrator.execute({
            id: "retry-review-test",
            prompt: "Build a student app",
          });

        expect(result.status).toBe(
          "COMPLETED"
        );

        expect(
          result.context.iteration
        ).toBe(1);

        expect(
          result.context.codingResult
            ?.output
        ).toBe("CODE");

        expect(
          result.context.reviewResult
            ?.status
        ).toBe("APPROVED");

        expect(
          result.context.decisionResult
            ?.decision
        ).toBe("COMPLETE");

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "planner:"
              )
          )
        ).toHaveLength(1);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "coder:"
              )
          )
        ).toHaveLength(1);

        expect(
          calls.filter(
            (call) =>
              call.startsWith(
                "reviewer:"
              )
          )
        ).toHaveLength(2);
      }
    );

    it(
      "should retry coding with failure feedback when the coder execution fails",
      async () => {
        const coderPrompts: string[] = [];
        let coderRuns = 0;

        const agentService: AgentService = {
          async run(
            role,
            input
          ) {
            if (role === "coder") {
              coderRuns += 1;
              coderPrompts.push(
                input.prompt
              );

              if (coderRuns === 1) {
                return {
                  status: "FAILURE",
                  output: "",
                  error:
                    "Coder process timed out",
                  durationMs: 0,
                };
              }

              return {
                status: "SUCCESS",
                output: "CODE",
                error: null,
                durationMs: 0,
              };
            }

            if (role === "planner") {
              return {
                status: "SUCCESS",
                output: "PLAN",
                error: null,
                durationMs: 0,
              };
            }

            return {
              status: "SUCCESS",
              output: "APPROVED",
              error: null,
              durationMs: 0,
            };
          },
        };

        const testingService: TestingService = {
          async run() {
            return {
              status: "PASSED",
              results: [
                {
                  status: "PASSED",
                  command: "npm.cmd",
                  args: ["test"],
                  exitCode: 0,
                  stdout: "passed",
                  stderr: "",
                  durationMs: 1,
                },
              ],
            };
          },
        };

        const iterationManager =
          createIterationManager({
            maxIterations: 5,
          });

        const decisionEngine =
          createDecisionEngine({
            iterationManager,
          });

        const orchestrator =
          new DefaultPipelineOrchestrator({
            agentService,
            testingService,
            testPlan:
              createTestPlan(),
            decisionEngine,
            iterationManager,
          });

        const result =
          await orchestrator.execute({
            id: "retry-coder-failure-test",
            prompt: "Build a student app",
          });

        expect(result.status).toBe(
          "COMPLETED"
        );

        expect(
          result.context.iteration
        ).toBe(1);

        expect(
          coderPrompts
        ).toHaveLength(2);

        expect(
          coderPrompts[1]
        ).toContain(
          "previous coding attempt failed to execute"
        );

        expect(
          coderPrompts[1]
        ).toContain(
          "Coder process timed out"
        );
      }
    );

    it(
      "should fail when the coder keeps failing past the retry budget",
      async () => {
        let coderRuns = 0;

        const agentService: AgentService = {
          async run(
            role,
            _input
          ) {
            if (role === "coder") {
              coderRuns += 1;

              return {
                status: "FAILURE",
                output: "",
                error: "coder boom",
                durationMs: 0,
              };
            }

            return {
              status: "SUCCESS",
              output: "PLAN",
              error: null,
              durationMs: 0,
            };
          },
        };

        const testingService: TestingService = {
          async run() {
            return {
              status: "PASSED",
              results: [],
            };
          },
        };

        const iterationManager =
          createIterationManager({
            maxIterations: 1,
          });

        const decisionEngine =
          createDecisionEngine({
            iterationManager,
          });

        const orchestrator =
          new DefaultPipelineOrchestrator({
            agentService,
            testingService,
            testPlan:
              createTestPlan(),
            decisionEngine,
            iterationManager,
          });

        const result =
          await orchestrator.execute({
            id: "retry-coder-exhausted-test",
            prompt: "Build a student app",
          });

        expect(result.status).toBe(
          "FAILED"
        );

        expect(
          result.context.failureReason
        ).toContain("coder boom");

        expect(coderRuns).toBe(2);
      }
    );
  }
);








