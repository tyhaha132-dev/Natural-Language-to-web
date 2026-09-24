import { describe, expect, it } from "vitest";

import {
  startServerProcess,
  type ServerProcess,
} from "../src/runtime/server-process.js";

async function waitForOutput(
  server: ServerProcess,
  stdoutText: string,
  stderrText: string,
  timeoutMs: number
): Promise<void> {
  const startTime = Date.now();

  while (
    (!server.stdout.includes(
      stdoutText
    ) ||
      !server.stderr.includes(
        stderrText
      )) &&
    Date.now() - startTime <
      timeoutMs
  ) {
    await new Promise(
      (resolve) =>
        setTimeout(resolve, 50)
    );
  }
}

describe(
  "ServerProcess",
  () => {
    it(
      "captures stdout and stderr",
      async () => {
        const server =
          startServerProcess(
            {
              command: process.execPath,
              args: [
                "-e",
                "console.log('SERVER_READY'); console.error('SERVER_ERROR'); setTimeout(() => {}, 1000)",
              ],
            },
            {
              cwd: process.cwd(),
            }
          );

        await waitForOutput(
          server,
          "SERVER_READY",
          "SERVER_ERROR",
          3_000
        );

        expect(
          server.stdout
        ).toContain("SERVER_READY");

        expect(
          server.stderr
        ).toContain("SERVER_ERROR");

        await server.stop();
      }
    );
  }
);
