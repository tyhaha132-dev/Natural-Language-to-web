import { spawn } from "node:child_process";
import type { ProcessResult } from "./process-result.js";
import { createTimeoutManager } from "./timeout-manager.js";

export interface ProcessOptions {
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function runProcess(
  command: string,
  args: readonly string[] = [],
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const isWindowsScript =
      process.platform === "win32" &&
      /\.(cmd|bat)$/i.test(command);

    const child = spawn(command, [...args], {
      cwd: options.cwd,
      env: options.env,
      shell: isWindowsScript,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timeoutCheckHandle: NodeJS.Timeout | undefined;

    const timeoutManager = createTimeoutManager();

    const cleanup = (): void => {
      timeoutManager.clear();

      if (timeoutCheckHandle !== undefined) {
        clearInterval(timeoutCheckHandle);
        timeoutCheckHandle = undefined;
      }
    };

    const finish = (exitCode: number | null): void => {
      if (settled) {
        return;
      }

      settled = true;

      const timedOut = timeoutManager.hasTimedOut();

      cleanup();

      resolve({
        command,
        args,
        exitCode: timedOut ? null : exitCode,
        stdout,
        stderr,
        timedOut,
        durationMs: Date.now() - startTime,
      });
    };

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      cleanup();

      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    child.on("close", (exitCode) => {
      finish(exitCode);
    });

    if (
      options.timeoutMs !== undefined &&
      options.timeoutMs > 0
    ) {
      timeoutManager.start(options.timeoutMs);

      timeoutCheckHandle = setInterval(() => {
        if (settled) {
          cleanup();
          return;
        }

        if (timeoutManager.hasTimedOut()) {
          child.kill();
        }
      }, 10);
    }
  });
}
