import type {
  ApplicationServer,
} from "./application-server.js";

import type {
  ApplicationServerFactory,
} from "./application-server-factory.js";

import type {
  RuntimeDiscovery,
} from "./runtime-discovery.js";

export interface ApplicationServerResolver {
  resolve(
    workspace: string
  ): Promise<ApplicationServer>;
}

export function createApplicationServerResolver(
  runtimeDiscovery: RuntimeDiscovery,
  applicationServerFactory:
    ApplicationServerFactory
): ApplicationServerResolver {
  return {
    async resolve(
      workspace
    ): Promise<ApplicationServer> {
      const runtime =
        await runtimeDiscovery.discover(
          workspace
        );

      return applicationServerFactory.create(
        runtime
      );
    },
  };
}
