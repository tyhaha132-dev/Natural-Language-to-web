import type { AgentResult } from "./agent-result.js";

export interface AgentInput {
  pipelineId: string;
  prompt: string;
  workspace: string;
}

export interface Agent {
  readonly name: string;

  run(input: AgentInput): Promise<AgentResult>;
}
