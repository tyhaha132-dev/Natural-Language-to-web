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
  StaticApplicationRuntime,
} from "../src/runtime/application-runtime.js";

import {
  createApplicationServerFactory,
} from "../src/runtime/application-server-factory.js";

describe(
  "ApplicationServerFactory",
  () => {
    it(
      "creates a StaticApplicationServer for STATIC runtime",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "factory-static-"
            )
          );

        try {
          await writeFile(
            path.join(
              workspace,
              "index.html"
            ),
            "<h1>Static Factory Test</h1>",
            "utf8"
          );

          const runtime:
            StaticApplicationRuntime = {
            type: "STATIC",
            workspace,
          };

          const factory =
            createApplicationServerFactory({
              port: 43130,
              readinessTimeoutMs: 5_000,
              readinessIntervalMs: 50,
            });

          const server =
            factory.create(runtime);

          expect(
            server.runtime.type
          ).toBe("STATIC");

          expect(
            server.runtime.workspace
          ).toBe(workspace);

          await server.start();

          expect(
            server.isRunning()
          ).toBe(true);

          const response =
            await fetch(
              server.baseUrl
            );

          expect(
            response.status
          ).toBe(200);

          await server.stop();

          expect(
            server.isRunning()
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
      "creates a NodeApplicationServer for NODE runtime",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "factory-node-"
            )
          );

        const port =
          43131;

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
                    response.writeHead(200);
                    response.end(
                      "Node Factory Test"
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

          const factory =
            createApplicationServerFactory({
              port,
              readinessTimeoutMs: 5_000,
              readinessIntervalMs: 50,
            });

          const server =
            factory.create(runtime);

          expect(
            server.runtime.type
          ).toBe("NODE");

          expect(
            server.runtime.workspace
          ).toBe(workspace);

          await server.start();

          expect(
            server.isRunning()
          ).toBe(true);

          const response =
            await fetch(
              server.baseUrl
            );

          expect(
            response.status
          ).toBe(200);

          expect(
            await response.text()
          ).toBe(
            "Node Factory Test"
          );

          await server.stop();

          expect(
            server.isRunning()
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
