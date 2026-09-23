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

import {
  createApplicationServerFactory,
} from "../src/runtime/application-server-factory.js";

import {
  createApplicationServerResolver,
} from "../src/runtime/application-server-resolver.js";

import {
  createNodeStartCommandResolver,
} from "../src/runtime/node-start-command-resolver.js";

import {
  createRuntimeDiscovery,
} from "../src/runtime/runtime-discovery.js";

describe(
  "ApplicationServerResolver",
  () => {
    it(
      "resolves a STATIC workspace into a running application server",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "resolver-static-"
            )
          );

        const port =
          43132;

        try {
          await writeFile(
            path.join(
              workspace,
              "index.html"
            ),
            `
              <!doctype html>
              <html>
                <body>
                  <h1>Resolver Static Test</h1>
                </body>
              </html>
            `,
            "utf8"
          );

          const runtimeDiscovery =
            createRuntimeDiscovery(
              createNodeStartCommandResolver()
            );

          const factory =
            createApplicationServerFactory({
              port,
              readinessTimeoutMs:
                5_000,
              readinessIntervalMs:
                50,
            });

          const resolver =
            createApplicationServerResolver(
              runtimeDiscovery,
              factory
            );

          const server =
            await resolver.resolve(
              workspace
            );

          expect(
            server.runtime.type
          ).toBe("STATIC");

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
          ).toContain(
            "Resolver Static Test"
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

    it(
      "resolves a NODE workspace into a running application server",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "resolver-node-"
            )
          );

        const port =
          43133;

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
                      "Resolver Node Test"
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

          await writeFile(
            path.join(
              workspace,
              "package.json"
            ),
            JSON.stringify({
              scripts: {
                start:
                  `node server.cjs ${port}`,
              },
            }),
            "utf8"
          );

          const runtimeDiscovery =
            createRuntimeDiscovery(
              createNodeStartCommandResolver()
            );

          const factory =
            createApplicationServerFactory({
              port,
              readinessTimeoutMs:
                5_000,
              readinessIntervalMs:
                50,
            });

          const resolver =
            createApplicationServerResolver(
              runtimeDiscovery,
              factory
            );

          const server =
            await resolver.resolve(
              workspace
            );

          expect(
            server.runtime.type
          ).toBe("NODE");

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
            "Resolver Node Test"
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
              force: true
            }
          );
        }
      }
    );
  }
);
