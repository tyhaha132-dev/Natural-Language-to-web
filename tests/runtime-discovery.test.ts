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
  createRuntimeDiscovery,
} from "../src/runtime/runtime-discovery.js";

import {
  createNodeStartCommandResolver,
} from "../src/runtime/node-start-command-resolver.js";

describe(
  "RuntimeDiscovery",
  () => {
    it(
      "discovers the benchmark workspace as STATIC",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "runtime-discovery-static-"
            )
          );

        try {
          await writeFile(
            path.join(
              workspace,
              "index.html"
            ),
            "<html></html>",
            "utf8"
          );

          const resolver =
            createNodeStartCommandResolver();

          const discovery =
            createRuntimeDiscovery(
              resolver
            );

          const runtime =
            await discovery.discover(
              workspace
            );

          expect(
            runtime
          ).toEqual({
            type: "STATIC",
            workspace:
              path.resolve(workspace),
          });
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
      "discovers a workspace with package.json as NODE",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "runtime-discovery-node-"
            )
          );

        try {
          await writeFile(
            path.join(
              workspace,
              "package.json"
            ),
            JSON.stringify({
              name: "test-app",
              scripts: {
                dev: "vite",
              },
            }),
            "utf8"
          );

          const resolver =
            createNodeStartCommandResolver();

          const discovery =
            createRuntimeDiscovery(
              resolver
            );

          const runtime =
            await discovery.discover(
              workspace
            );

          expect(
            runtime.type
          ).toBe("NODE");

          if (
            runtime.type !== "NODE"
          ) {
            throw new Error(
              "Expected NODE runtime"
            );
          }

          expect(
            runtime.workspace
          ).toBe(
            path.resolve(workspace)
          );

          expect(
            runtime.startCommand
          ).toEqual({
            command:
              process.platform === "win32"
                ? "npm.cmd"
                : "npm",
            args: [
              "run",
              "dev",
            ],
          });
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
      "fails when the workspace has no recognized runtime marker",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "runtime-discovery-invalid-"
            )
          );

        try {
          const resolver =
            createNodeStartCommandResolver();

          const discovery =
            createRuntimeDiscovery(
              resolver
            );

          await expect(
            discovery.discover(
              workspace
            )
          ).rejects.toThrow(
            "Unable to discover application runtime"
          );
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
