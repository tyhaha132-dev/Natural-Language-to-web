import { runProcess } from "../../runtime/process-runner.js";

export interface EnvironmentCheckResult {
  name: string;
  available: boolean;
  version: string | null;
  error: string | null;
}

async function checkCommand(
  name: string,
  command: string,
  args: readonly string[]
): Promise<EnvironmentCheckResult> {
  try {
    const result = await runProcess(
      command,
      args,
      {
        timeoutMs: 5_000,
      }
    );

    if (
      result.exitCode !== 0 ||
      result.timedOut
    ) {
      return {
        name,
        available: false,
        version: null,
        error:
          result.stderr.trim() ||
          `Command exited with code ${result.exitCode}`,
      };
    }

    return {
      name,
      available: true,
      version:
        result.stdout.trim() ||
        null,
      error: null,
    };
  } catch (error) {
    return {
      name,
      available: false,
      version: null,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

export async function checkNode(): Promise<EnvironmentCheckResult> {
  return checkCommand(
    "node",
    process.execPath,
    ["--version"]
  );
}

export async function checkNpm(): Promise<EnvironmentCheckResult> {
  const command =
    process.platform === "win32"
      ? "npm.cmd"
      : "npm";

  return checkCommand(
    "npm",
    command,
    ["--version"]
  );
}

export async function checkDocker(): Promise<EnvironmentCheckResult> {
  return checkCommand(
    "docker",
    "docker",
    ["--version"]
  );
}

export async function checkEnvironment(): Promise<
  EnvironmentCheckResult[]
> {
  return Promise.all([
    checkNode(),
    checkNpm(),
    checkDocker(),
  ]);
}
