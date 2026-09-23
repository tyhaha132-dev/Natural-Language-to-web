import { spawn, type ChildProcess } from "node:child_process";

import type {
  CommandSpec,
} from "./command-builder.js";

export interface ServerProcess {
  readonly command: string;
  readonly args: readonly string[];

  readonly pid: number | undefined;

  readonly stdout: string;
  readonly stderr: string;

  isRunning(): boolean;

  stop(): Promise<void>;
}

export interface ServerProcessOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
}

export function startServerProcess(
  commandSpec: CommandSpec,
  options: ServerProcessOptions
): ServerProcess {
  const isWindowsScript =
    process.platform === "win32" &&
    /\.(cmd|bat)$/i.test(
      commandSpec.command
    );

  const child: ChildProcess = spawn(
    commandSpec.command,
    [...commandSpec.args],
    {
      cwd: options.cwd,
      env: options.env,
      shell: isWindowsScript,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let stdout = "";
  let stderr = "";
  let stopped = false;

  child.stdout?.on(
    "data",
    (data: Buffer) => {
      stdout += data.toString();
    }
  );

  child.stderr?.on(
    "data",
    (data: Buffer) => {
      stderr += data.toString();
    }
  );

  child.on("close", () => {
    stopped = true;
  });

  child.on("error", () => {
    stopped = true;
  });

  return {
    command: commandSpec.command,
    args: [...commandSpec.args],

    get pid() {
      return child.pid;
    },

    get stdout() {
      return stdout;
    },

    get stderr() {
      return stderr;
    },

    isRunning(): boolean {
      return !stopped;
    },

    async stop(): Promise<void> {
      if (stopped) {
        return;
      }

      stopped = true;

      if (child.exitCode !== null) {
        return;
      }

      child.kill();

      await new Promise<void>(
        (resolve) => {
          child.once("close", () => {
            resolve();
          });

          child.once("error", () => {
            resolve();
          });
        }
      );
    },
  };
}
