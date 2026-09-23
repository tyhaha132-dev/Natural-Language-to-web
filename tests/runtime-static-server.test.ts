import { describe, expect, it } from "vitest";

import {
  createStaticServer,
} from "../src/runtime/static-server.js";

describe(
  "StaticServer",
  () => {
    it(
      "serves the workspace index.html",
      async () => {
        const workspace =
          "D:\\project\\web-coding-agent\\workspaces\\pipeline-e2e-20260923-04";

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
        }
      }
    );
  }
);
