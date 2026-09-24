import { spawn, type ChildProcess } from "node:child_process";
import type { CommandSpec } from "./command-builder.js";

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

const STOP_TIMEOUT_MS = 5_000;

function waitForProcessClose(
  child: ChildProcess,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (): void => {
      if (settled) return;

      settled = true;

      clearTimeout(timeout);
      child.removeListener("close", finish);
      child.removeListener("error", finish);

      resolve();
    };

    const timeout = setTimeout(
      finish,
      timeoutMs
    );

    child.once("close", finish);
    child.once("error", finish);

    if (child.exitCode !== null) {
      finish();
    }
  });
}

function killWindowsProcessTree(
  pid: number
): Promise<void> {
  return new Promise((resolve) => {
    const taskkill = spawn(
      "taskkill.exe",
      [
        "/PID",
        String(pid),
        "/T",
        "/F",
      ],
      {
        stdio: [
          "ignore",
          "ignore",
          "ignore",
        ],
      }
    );

    let settled = false;

    const finish = (): void => {
      if (settled) return;

      settled = true;

      clearTimeout(timeout);

      resolve();
    };

    const timeout = setTimeout(
      finish,
      STOP_TIMEOUT_MS
    );

    taskkill.once(
      "close",
      finish
    );

    taskkill.once(
      "error",
      finish
    );
  });
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

  const child: ChildProcess =
    spawn(
      commandSpec.command,
      [...commandSpec.args],
      {
        cwd: options.cwd,
        env: options.env,
        shell: isWindowsScript,
        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
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

  child.on(
    "close",
    () => {
      stopped = true;
    }
  );

  child.on(
    "error",
    () => {
      stopped = true;
    }
  );

  return {
    command: commandSpec.command,

    args: [
      ...commandSpec.args,
    ],

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

      const pid = child.pid;

      if (child.exitCode !== null) {
        stopped = true;
        return;
      }

      /*
       * IMPORTANT:
       * Start waiting for the child BEFORE
       * killing it. Otherwise the process may
       * emit "close" before the listener exists.
       */
      const closePromise =
        waitForProcessClose(
          child,
          STOP_TIMEOUT_MS
        );

      if (
        process.platform === "win32" &&
        pid !== undefined
      ) {
        await killWindowsProcessTree(
          pid
        );
      } else {
        child.kill();
      }

      stopped = true;

      await closePromise;
    },
  };
}
