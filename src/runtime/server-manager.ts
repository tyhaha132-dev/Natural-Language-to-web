import type {
  CommandSpec,
} from "./command-builder.js";

import {
  startServerProcess,
  type ServerProcess,
} from "./server-process.js";

export interface ReadinessOptions {
  url: string;
  timeoutMs: number;
  intervalMs: number;
}

export interface ServerManager {
  start(
    command: CommandSpec,
    cwd: string,
    env?: NodeJS.ProcessEnv
  ): ServerProcess;

  waitUntilReady(
    server: ServerProcess,
    options: ReadinessOptions
  ): Promise<void>;

  stop(
    server: ServerProcess
  ): Promise<void>;
}

function sleep(
  milliseconds: number
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(resolve, milliseconds);
    }
  );
}

export function createServerManager(): ServerManager {
  return {
    start(
      command,
      cwd,
      env
    ): ServerProcess {
      return startServerProcess(
        command,
        {
          cwd,
          env,
        }
      );
    },

    async waitUntilReady(
      server,
      options
    ): Promise<void> {
      const startedAt = Date.now();

      while (
        Date.now() - startedAt <
        options.timeoutMs
      ) {
        if (!server.isRunning()) {
          throw new Error(
            [
              "Server process exited before becoming ready.",
              `stdout: ${server.stdout}`,
              `stderr: ${server.stderr}`,
            ].join("\n")
          );
        }

        try {
          const response =
            await fetch(options.url);

          if (response.ok) {
            return;
          }
        } catch {
          // Server is not ready yet.
        }

        await sleep(
          options.intervalMs
        );
      }

      throw new Error(
        [
          `Server readiness timeout after ${options.timeoutMs}ms.`,
          `URL: ${options.url}`,
          `stdout: ${server.stdout}`,
          `stderr: ${server.stderr}`,
        ].join("\n")
      );
    },

    async stop(
      server
    ): Promise<void> {
      await server.stop();
    },
  };
}
