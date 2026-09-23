import type {
  ApplicationRuntime,
} from "./application-runtime.js";

import type {
  ApplicationServer,
} from "./application-server.js";

import {
  createNodeApplicationServer,
} from "./node-application-server.js";

import {
  createStaticApplicationServer,
} from "./static-application-server.js";

export interface ApplicationServerFactoryOptions {
  readonly port: number;

  readonly readinessTimeoutMs: number;

  readonly readinessIntervalMs: number;

  readonly env?: NodeJS.ProcessEnv;
}

export interface ApplicationServerFactory {
  create(
    runtime: ApplicationRuntime
  ): ApplicationServer;
}

export function createApplicationServerFactory(
  options: ApplicationServerFactoryOptions
): ApplicationServerFactory {
  return {
    create(
      runtime
    ): ApplicationServer {
      switch (runtime.type) {
        case "NODE":
          return createNodeApplicationServer({
            runtime,
            port: options.port,
            readinessTimeoutMs:
              options.readinessTimeoutMs,
            readinessIntervalMs:
              options.readinessIntervalMs,
            env: options.env,
          });

        case "STATIC":
          return createStaticApplicationServer({
            runtime,
            port: options.port,
            readinessTimeoutMs:
              options.readinessTimeoutMs,
            readinessIntervalMs:
              options.readinessIntervalMs,
          });

        default: {
          const exhaustiveCheck:
            never = runtime;

          throw new Error(
            `Unsupported application runtime: ${String(
              exhaustiveCheck
            )}`
          );
        }
      }
    },
  };
}
