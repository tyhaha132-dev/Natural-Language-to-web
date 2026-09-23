import { describe, expect, it } from "vitest";

import {
  createServerManager,
} from "../src/runtime/server-manager.js";

async function waitForPort(
  server: {
    readonly stdout: string;
  },
  timeoutMs = 5_000
): Promise<number> {
  const startedAt = Date.now();

  while (
    Date.now() - startedAt <
    timeoutMs
  ) {
    const match =
      server.stdout.match(
        /SERVER_PORT:(\d+)/
      );

    if (match !== null) {
      return Number(match[1]);
    }

    await new Promise<void>(
      (resolve) => {
        setTimeout(resolve, 10);
      }
    );
  }

  throw new Error(
    "Timed out waiting for server port."
  );
}

describe(
  "ServerManager",
  () => {
    it(
      "waits until an HTTP server is ready",
      async () => {
        const manager =
          createServerManager();

        const server =
          manager.start(
            {
              command: process.execPath,
              args: [
                "-e",
                `
                const http = require("node:http");

                const server = http.createServer(
                  (_req, res) => {
                    res.writeHead(200, {
                      "Content-Type": "text/plain"
                    });

                    res.end("READY");
                  }
                );

                server.listen(
                  0,
                  "127.0.0.1",
                  () => {
                    const address =
                      server.address();

                    if (
                      address === null ||
                      typeof address === "string"
                    ) {
                      process.exit(1);
                    }

                    console.log(
                      "SERVER_PORT:" +
                      address.port
                    );
                  }
                );
                `,
              ],
            },
            process.cwd()
          );

        try {
          const port =
            await waitForPort(server);

          await manager.waitUntilReady(
            server,
            {
              url:
                `http://127.0.0.1:${port}`,
              timeoutMs: 5_000,
              intervalMs: 100,
            }
          );

          expect(
            server.isRunning()
          ).toBe(true);
        } finally {
          await manager.stop(server);
        }

        expect(
          server.isRunning()
        ).toBe(false);
      }
    );

    it(
      "fails when the server exits before becoming ready",
      async () => {
        const manager =
          createServerManager();

        const server =
          manager.start(
            {
              command: process.execPath,
              args: [
                "-e",
                `
                console.error(
                  "SERVER_STARTUP_FAILED"
                );

                process.exit(1);
                `,
              ],
            },
            process.cwd()
          );

        await expect(
          manager.waitUntilReady(
            server,
            {
              url:
                "http://127.0.0.1:43128",
              timeoutMs: 5_000,
              intervalMs: 100,
            }
          )
        ).rejects.toThrow(
          "Server process exited before becoming ready"
        );

        expect(
          server.stderr
        ).toContain(
          "SERVER_STARTUP_FAILED"
        );

        await manager.stop(server);
      }
    );
  }
);
