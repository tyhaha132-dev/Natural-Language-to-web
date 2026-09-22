import type {
  Agent,
  AgentInput,
} from "./agent-contract.js";
import type { AgentExecutor } from "./agent-executor.js";
import type { AgentResult } from "./agent-result.js";

export abstract class BaseAgent
  implements Agent
{
  readonly name: string;
  protected readonly model: string;
  protected readonly executor: AgentExecutor;

  protected constructor(
    name: string,
    model: string,
    executor: AgentExecutor
  ) {
    this.name = name;
    this.model = model;
    this.executor = executor;
  }

  async run(
    input: AgentInput
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const result =
        await this.executor.execute(
          input,
          this.model
        );

      if (
        result.timedOut ||
        result.exitCode !== 0
      ) {
        return {
          status: "FAILURE",
          output: result.stdout,
          error:
            result.stderr.trim() ||
            `Agent process exited with code ${result.exitCode}`,
          durationMs:
            Date.now() - startTime,
        };
      }

      return {
        status: "SUCCESS",
        output: result.stdout,
        error: null,
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
}
