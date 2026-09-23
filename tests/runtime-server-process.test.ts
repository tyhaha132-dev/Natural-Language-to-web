import { describe, expect, it } from "vitest";

import {
  startServerProcess,
} from "../src/runtime/server-process.js";

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

        await new Promise(
          (resolve) =>
            setTimeout(resolve, 100)
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
