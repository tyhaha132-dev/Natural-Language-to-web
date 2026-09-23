import {
  readFile,
} from "node:fs/promises";

import path from "node:path";

import type {
  ApplicationStartCommand,
} from "./application-start-command.js";

interface PackageJson {
  scripts?: Record<
    string,
    string
  >;
}

export interface NodeStartCommandResolver {
  resolve(
    workspace: string
  ): Promise<ApplicationStartCommand>;
}

async function readPackageJson(
  workspace: string
): Promise<PackageJson> {
  const packageJsonPath =
    path.join(
      workspace,
      "package.json"
    );

  const content =
    await readFile(
      packageJsonPath,
      "utf8"
    );

  return JSON.parse(content) as PackageJson;
}

export function createNodeStartCommandResolver():
  NodeStartCommandResolver {
  return {
    async resolve(
      workspace
    ): Promise<ApplicationStartCommand> {
      const workspacePath =
        path.resolve(workspace);

      const packageJson =
        await readPackageJson(
          workspacePath
        );

      const scripts =
        packageJson.scripts ?? {};

      if (
        typeof scripts.dev === "string" &&
        scripts.dev.trim() !== ""
      ) {
        return {
          command:
            process.platform === "win32"
              ? "npm.cmd"
              : "npm",
          args: [
            "run",
            "dev",
          ],
        };
      }

      if (
        typeof scripts.start === "string" &&
        scripts.start.trim() !== ""
      ) {
        return {
          command:
            process.platform === "win32"
              ? "npm.cmd"
              : "npm",
          args: [
            "start",
          ],
        };
      }

      throw new Error(
        [
          "Unable to resolve Node application start command.",
          `Workspace: ${workspacePath}`,
          "Expected scripts.dev or scripts.start in package.json.",
        ].join("\n")
      );
    },
  };
}
