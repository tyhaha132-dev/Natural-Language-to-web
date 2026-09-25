import { describe, expect, it } from "vitest";

import {
  promises as fs,
} from "node:fs";

import os from "node:os";

import path from "node:path";

import {
  createStaticServer,
} from "../src/runtime/static-server.js";

const FIXTURE_HTML = [
  "<!DOCTYPE html>",
  '<html lang="en">',
  "<head>",
  '    <meta charset="UTF-8">',
  '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  "    <title>Hello World App</title>",
  "</head>",
  "<body>",
  "    <h1>Hello World</h1>",
  "</body>",
  "</html>",
  "",
].join("\n");

async function createFixtureWorkspace(): Promise<string> {
  const workspace =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "static-server-"
      )
    );

  await fs.writeFile(
    path.join(
      workspace,
      "index.html"
    ),
    FIXTURE_HTML,
    "utf8"
  );

  return workspace;
}

describe(
  "StaticServer",
  () => {
    it(
      "serves the workspace index.html",
      async () => {
        const workspace =
          await createFixtureWorkspace();

        const server =
          createStaticServer({
            workspace,
            port: 43129,
            readinessTimeoutMs: 5_000,
            readinessIntervalMs: 100,
          });

        try {
          await server.start();

          const response =
            await fetch(
              `${server.baseUrl}/`
            );

          expect(
            response.status
          ).toBe(200);

          const body =
            await response.text();

          expect(body).toContain(
            "<h1>Hello World</h1>"
          );

          expect(body).toContain(
            "<title>Hello World App</title>"
          );
        } finally {
          await server.stop();

          await fs.rm(
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
