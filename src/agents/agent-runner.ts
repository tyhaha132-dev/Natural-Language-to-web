import type {
  Agent,
  AgentInput,
} from "./agent-contract.js";
import type { AgentResult } from "./agent-result.js";

export async function runAgent(
  agent: Agent,
  input: AgentInput
): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    const result = await agent.run(input);

    return {
      ...result,
      durationMs:
        Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "FAILURE",
      output: "",
      error:
        error instanceof Error
          ? error.message
          : String(error),
      durationMs:
        Date.now() - startTime,
    };
  }
}
