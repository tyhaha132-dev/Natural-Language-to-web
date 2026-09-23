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
  createNodeStartCommandResolver,
} from "../src/runtime/node-start-command-resolver.js";

describe(
  "NodeStartCommandResolver",
  () => {
    it(
      "resolves scripts.dev to npm run dev",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "node-runtime-dev-"
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

          const command =
            await resolver.resolve(
              workspace
            );

          expect(
            command.command
          ).toBe(
            process.platform === "win32"
              ? "npm.cmd"
              : "npm"
          );

          expect(
            command.args
          ).toEqual([
            "run",
            "dev",
          ]);
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
      "resolves scripts.start to npm start",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "node-runtime-start-"
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
                start: "node server.js",
              },
            }),
            "utf8"
          );

          const resolver =
            createNodeStartCommandResolver();

          const command =
            await resolver.resolve(
              workspace
            );

          expect(
            command.command
          ).toBe(
            process.platform === "win32"
              ? "npm.cmd"
              : "npm"
          );

          expect(
            command.args
          ).toEqual([
            "start",
          ]);
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
      "fails when neither dev nor start exists",
      async () => {
        const workspace =
          await mkdtemp(
            path.join(
              os.tmpdir(),
              "node-runtime-invalid-"
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
                build: "tsc",
              },
            }),
            "utf8"
          );

          const resolver =
            createNodeStartCommandResolver();

          await expect(
            resolver.resolve(
              workspace
            )
          ).rejects.toThrow(
            "Unable to resolve Node application start command"
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
