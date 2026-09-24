import type { AgentInput } from "./agent-contract.js";
import type { AgentResult } from "./agent-result.js";
import type { AgentRole, AgentFactory } from "./agent-factory.js";
import { runAgent } from "./agent-runner.js";

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
    async run(role, input): Promise<AgentResult> {
      console.log(`[AGENT_SERVICE_DEBUG] run started`);
      console.log(`[AGENT_SERVICE_DEBUG] role: ${role}`);
      console.log(`[AGENT_SERVICE_DEBUG] pipelineId: ${input.pipelineId}`);
      console.log(`[AGENT_SERVICE_DEBUG] workspace: ${input.workspace}`);
      console.log(`[AGENT_SERVICE_DEBUG] prompt length: ${input.prompt.length}`);

      const agent = factory.create(role);

      console.log(
        `[AGENT_SERVICE_DEBUG] agent created: ${agent.name}`
      );

      console.log(
        `[AGENT_SERVICE_DEBUG] calling runAgent`
      );

      const result = await runAgent(agent, input);

      console.log(
        `[AGENT_SERVICE_DEBUG] runAgent returned`
      );

      console.log(
        `[AGENT_SERVICE_DEBUG] status: ${result.status}`
      );

      console.log(
        `[AGENT_SERVICE_DEBUG] durationMs: ${result.durationMs}`
      );

      console.log(
        `[AGENT_SERVICE_DEBUG] output length: ${result.output.length}`
      );

      return result;
    },
  };
}
