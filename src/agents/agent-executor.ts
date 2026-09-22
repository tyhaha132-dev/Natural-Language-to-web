import type { ProcessResult } from "../runtime/process-result.js";
import type { AgentInput } from "./agent-contract.js";

export interface AgentExecutor {
  execute(
    input: AgentInput,
    model: string
  ): Promise<ProcessResult>;
}
