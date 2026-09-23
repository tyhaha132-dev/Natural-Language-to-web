import {
  access,
} from "node:fs/promises";

import path from "node:path";

import type {
  ApplicationRuntime,
} from "./application-runtime.js";

import type {
  NodeStartCommandResolver,
} from "./node-start-command-resolver.js";

async function exists(
  filePath: string
): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface RuntimeDiscovery {
  discover(
    workspace: string
  ): Promise<ApplicationRuntime>;
}

export function createRuntimeDiscovery(
  nodeStartCommandResolver:
    NodeStartCommandResolver
): RuntimeDiscovery {
  return {
    async discover(
      workspace
    ): Promise<ApplicationRuntime> {
      const workspacePath =
        path.resolve(workspace);

      const packageJsonPath =
        path.join(
          workspacePath,
          "package.json"
        );

      if (
        await exists(packageJsonPath)
      ) {
        const startCommand =
          await nodeStartCommandResolver.resolve(
            workspacePath
          );

        return {
          type: "NODE",
          workspace: workspacePath,
          startCommand,
        };
      }

      const indexHtmlPath =
        path.join(
          workspacePath,
          "index.html"
        );

      if (
        await exists(indexHtmlPath)
      ) {
        return {
          type: "STATIC",
          workspace: workspacePath,
        };
      }

      throw new Error(
        [
          "Unable to discover application runtime.",
          `Workspace: ${workspacePath}`,
          "Expected package.json or index.html.",
        ].join("\n")
      );
    },
  };
}
