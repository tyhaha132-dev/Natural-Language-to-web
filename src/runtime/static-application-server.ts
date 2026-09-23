import type {
  ApplicationServer,
} from "./application-server.js";

import type {
  StaticApplicationRuntime,
} from "./application-runtime.js";

import {
  createStaticServer,
  type StaticServer,
} from "./static-server.js";

export interface StaticApplicationServerOptions {
  readonly runtime:
    StaticApplicationRuntime;

  readonly port: number;

  readonly readinessTimeoutMs: number;

  readonly readinessIntervalMs: number;
}

export function createStaticApplicationServer(
  options: StaticApplicationServerOptions
): ApplicationServer {
  const staticServer:
    StaticServer =
    createStaticServer({
      workspace:
        options.runtime.workspace,

      port:
        options.port,

      readinessTimeoutMs:
        options.readinessTimeoutMs,

      readinessIntervalMs:
        options.readinessIntervalMs,
    });

  return {
    runtime:
      options.runtime,

    baseUrl:
      staticServer.baseUrl,

    async start(): Promise<void> {
      await staticServer.start();
    },

    async stop(): Promise<void> {
      await staticServer.stop();
    },

    isRunning(): boolean {
      return staticServer.isRunning();
    },
  };
}
