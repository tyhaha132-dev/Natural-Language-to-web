import type {
  AgentInput,
} from "./agent-contract.js";

import type {
  AgentResult,
} from "./agent-result.js";

import type {
  AgentRole,
  AgentFactory,
} from "./agent-factory.js";

import {
  runAgent,
} from "./agent-runner.js";

export interface AgentService {
  run(
    role: AgentRole,
    input: AgentInput
  ): Promise<AgentResult>;
}

export function createAgentService(
  factory: AgentFactory
): AgentService {
  return {
    async run(
      role: AgentRole,
      input: AgentInput
    ): Promise<AgentResult> {
      const agent =
        factory.create(role);

      return runAgent(
        agent,
        input
      );
    },
  };
}
