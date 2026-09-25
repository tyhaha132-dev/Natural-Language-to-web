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

  console.log(
    `[RUN_AGENT_DEBUG] START agent=${agent.name} pipeline=${input.pipelineId}`
  );

  try {
    console.log(
      `[RUN_AGENT_DEBUG] BEFORE agent.run agent=${agent.name}`
    );

    const result = await agent.run(input);

    console.log(
      `[RUN_AGENT_DEBUG] AFTER agent.run agent=${agent.name} status=${result.status}`
    );

    return {
      ...result,
      durationMs:
        Date.now() - startTime,
    };
  } catch (error) {
    console.log(
      `[RUN_AGENT_DEBUG] ERROR agent=${agent.name}: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );

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
