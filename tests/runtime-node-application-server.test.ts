import {
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";

import os from "node:os";
import path from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  NodeApplicationRuntime,
} from "../src/runtime/application-runtime.js";

import {
  createNodeApplicationServer,
} from "../src/runtime/node-application-server.js";

describe(
  "NodeApplicationServer",
  () => {
    it(
      "starts, becomes ready, and stops a Node application",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "node-application-server-"
            )
          );

        const port =
          43127;

        try {
          const serverFile =
            path.join(
              workspace,
              "server.cjs"
            );

          await writeFile(
            serverFile,
            `
              const http =
                require("node:http");

              const port =
                Number(process.argv[2]);

              const server =
                http.createServer(
                  (_request, response) => {
                    response.writeHead(
                      200,
                      {
                        "Content-Type":
                          "text/plain; charset=utf-8"
                      }
                    );

                    response.end(
                      "Node application ready"
                    );
                  }
                );

              server.listen(
                port,
                "127.0.0.1"
              );
            `,
            "utf8"
          );

          const runtime:
            NodeApplicationRuntime = {
            type: "NODE",
            workspace,
            startCommand: {
              command:
                process.execPath,
              args: [
                serverFile,
                String(port),
              ],
            },
          };

          const applicationServer =
            createNodeApplicationServer({
              runtime,
              port,
              readinessTimeoutMs:
                5_000,
              readinessIntervalMs:
                50,
            });

          expect(
            applicationServer.isRunning()
          ).toBe(false);

          await applicationServer.start();

          expect(
            applicationServer.isRunning()
          ).toBe(true);

          expect(
            applicationServer.baseUrl
          ).toBe(
            `http://127.0.0.1:${port}`
          );

          const response =
            await fetch(
              applicationServer.baseUrl
            );

          expect(
            response.status
          ).toBe(200);

          expect(
            await response.text()
          ).toBe(
            "Node application ready"
          );

          await applicationServer.stop();

          expect(
            applicationServer.isRunning()
          ).toBe(false);
        } finally {
          await rm(
            workspace,
            {
              recursive: true,
              force: true,
            }
          );
        }
      }
    );

    it(
      "stops the server when readiness fails",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "node-application-server-failure-"
            )
          );

        const port =
          43128;

        try {
          const runtime:
            NodeApplicationRuntime = {
            type: "NODE",
            workspace,
            startCommand: {
              command:
                process.execPath,
              args: [
                "-e",
                "setTimeout(() => {}, 10000)",
              ],
            },
          };

          const applicationServer =
            createNodeApplicationServer({
              runtime,
              port,
              readinessTimeoutMs:
                300,
              readinessIntervalMs:
                50,
            });

          await expect(
            applicationServer.start()
          ).rejects.toThrow(
            "Server readiness timeout"
          );

          expect(
            applicationServer.isRunning()
          ).toBe(false);
        } finally {
          await rm(
            workspace,
            {
              recursive: true,
              force: true,
            }
          );
        }
      }
    );
  }
);
