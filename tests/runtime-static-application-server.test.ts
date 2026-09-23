import {
  createServer,
} from "node:net";

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
  StaticApplicationRuntime,
} from "../src/runtime/application-runtime.js";

import {
  createStaticApplicationServer,
} from "../src/runtime/static-application-server.js";

async function getFreePort(): Promise<number> {
  const server =
    createServer();

  await new Promise<void>(
    (resolve, reject) => {
      server.once(
        "error",
        reject
      );

      server.listen(
        0,
        "127.0.0.1",
        () => {
          resolve();
        }
      );
    }
  );

  const address =
    server.address();

  if (
    address === null ||
    typeof address === "string"
  ) {
    server.close();

    throw new Error(
      "Unable to determine allocated port."
    );
  }

  const port =
    address.port;

  await new Promise<void>(
    (resolve, reject) => {
      server.close(
        (error) => {
          if (error !== undefined) {
            reject(error);
            return;
          }

          resolve();
        }
      );
    }
  );

  return port;
}

async function removeWorkspace(
  workspace: string
): Promise<void> {
  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {
    try {
      await rm(
        workspace,
        {
          recursive: true,
          force: true,
        }
      );

      return;
    } catch (error) {
      if (
        attempt === 19
      ) {
        throw error;
      }

      await new Promise<void>(
        (resolve) => {
          setTimeout(
            resolve,
            50
          );
        }
      );
    }
  }
}

describe(
  "StaticApplicationServer",
  () => {
    it(
      "starts, serves the application, and stops",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "static-application-server-"
            )
          );

        const port =
          await getFreePort();

        const runtime:
          StaticApplicationRuntime = {
          type: "STATIC",
          workspace,
        };

        const applicationServer =
          createStaticApplicationServer({
            runtime,
            port,
            readinessTimeoutMs:
              5_000,
            readinessIntervalMs:
              50,
          });

        try {
          await writeFile(
            path.join(
              workspace,
              "index.html"
            ),
            `
              <!doctype html>
              <html>
                <head>
                  <title>Static App</title>
                </head>
                <body>
                  <h1>Static Application</h1>
                </body>
              </html>
            `,
            "utf8"
          );

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

          const body =
            await response.text();

          expect(
            body
          ).toContain(
            "<h1>Static Application</h1>"
          );

          await applicationServer.stop();

          expect(
            applicationServer.isRunning()
          ).toBe(false);
        } finally {
          if (
            applicationServer.isRunning()
          ) {
            await applicationServer.stop();
          }

          await removeWorkspace(
            workspace
          );
        }
      }
    );
  }
);
