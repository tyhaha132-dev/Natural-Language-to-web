import type { Agent } from "./agent-contract.js";
import type { AgentExecutor } from "./agent-executor.js";
import { CoderAgent } from "./coder/coder.js";
import { PlannerAgent } from "./planner/planner.js";
import { ReviewerAgent } from "./reviewer/reviewer.js";

export type AgentRole =
  | "planner"
  | "coder"
  | "reviewer";

export interface AgentFactory {
  create(role: AgentRole): Agent;
}

export function createAgentFactory(
  executor: AgentExecutor
): AgentFactory {
  return {
    create(role: AgentRole): Agent {
      switch (role) {
        case "planner":
          return new PlannerAgent(
            executor
          );

        case "coder":
          return new CoderAgent(
            executor
          );

        case "reviewer":
          return new ReviewerAgent(
            executor
          );

        default:
          throw new Error(
            `Unsupported agent role: ${role}`
          );
      }
    },
  };
}
