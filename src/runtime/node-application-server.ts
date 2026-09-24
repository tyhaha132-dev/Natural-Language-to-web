import type {
  ApplicationServer,
} from "./application-server.js";

import type {
  NodeApplicationRuntime,
} from "./application-runtime.js";

import {
  createServerManager,
  type ServerManager,
  type ReadinessOptions,
} from "./server-manager.js";

import type {
  ServerProcess,
} from "./server-process.js";

export interface NodeApplicationServerOptions {
  readonly runtime:
    NodeApplicationRuntime;

  readonly port: number;

  readonly readinessTimeoutMs: number;

  readonly readinessIntervalMs: number;

  readonly manager?: ServerManager;

  readonly env?: NodeJS.ProcessEnv;
}

export function createNodeApplicationServer(
  options: NodeApplicationServerOptions
): ApplicationServer {
  const manager =
    options.manager ??
    createServerManager();

  const baseUrl =
    `http://127.0.0.1:${options.port}`;

  let server:
    ServerProcess | null = null;

  return {
    runtime:
      options.runtime,

    baseUrl,

    async start(): Promise<void> {
      if (server !== null) {
        throw new Error(
          "NodeApplicationServer is already started"
        );
      }

      const environment: NodeJS.ProcessEnv = {
        ...process.env,
        ...options.env,
        PORT: String(options.port),
      };

      server =
        manager.start(
          options.runtime.startCommand,
          options.runtime.workspace,
          environment
        );

      const readiness:
        ReadinessOptions = {
        url: baseUrl,
        timeoutMs:
          options.readinessTimeoutMs,
        intervalMs:
          options.readinessIntervalMs,
      };

      try {
        await manager.waitUntilReady(
          server,
          readiness
        );
      } catch (error) {
        await manager.stop(server);
        server = null;
        throw error;
      }
    },

    async stop(): Promise<void> {
      if (server === null) {
        return;
      }

      const currentServer =
        server;

      server = null;

      await manager.stop(
        currentServer
      );
    },

    isRunning(): boolean {
      return (
        server !== null &&
        server.isRunning()
      );
    },
  };
}
