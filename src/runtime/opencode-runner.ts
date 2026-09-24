import type { ProcessResult } from "./process-result.js";
import { buildCommand } from "./command-builder.js";
import { runProcess } from "./process-runner.js";
import { resolveOpenCodeExecutable } from "./opencode-resolver.js";

export interface OpenCodeOptions {
  model: string;
  prompt: string;
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export async function runOpenCode(
  options: OpenCodeOptions
): Promise<ProcessResult> {
  const executable =
    await resolveOpenCodeExecutable();

  const command =
    buildCommand(
      executable,
      [
        "run",
        "--auto",
        "--model",
        options.model,
        options.prompt,
      ]
    );

  return runProcess(
    command.command,
    command.args,
    {
      cwd: options.cwd,
      timeoutMs:
        options.timeoutMs,
      env:
        options.env,
    }
  );
}
