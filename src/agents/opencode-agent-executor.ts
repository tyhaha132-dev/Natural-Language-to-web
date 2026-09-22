import type { ProcessResult } from "../runtime/process-result.js";
import {
  runOpenCode,
} from "../runtime/opencode-runner.js";
import type {
  AgentExecutor,
} from "./agent-executor.js";
import type {
  AgentInput,
} from "./agent-contract.js";

export interface OpenCodeAgentExecutorOptions {
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function createOpenCodeAgentExecutor(
  options: OpenCodeAgentExecutorOptions = {}
): AgentExecutor {
  return {
    async execute(
      input: AgentInput,
      model: string
    ): Promise<ProcessResult> {
      return runOpenCode({
        model,
        prompt: input.prompt,
        cwd: input.workspace,
        timeoutMs: options.timeoutMs,
        env: options.env,
      });
    },
  };
}
