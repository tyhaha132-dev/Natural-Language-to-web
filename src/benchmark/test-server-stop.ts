import { createNodeApplicationServer } from "../runtime/node-application-server.js";
import { createNodeStartCommandResolver } from "../runtime/node-start-command-resolver.js";
import { createRuntimeDiscovery } from "../runtime/runtime-discovery.js";

const workspace =
  "D:\\project\\web-coding-agent\\workspaces\\layer10-node-smoke-test";

const nodeStartCommandResolver =
  createNodeStartCommandResolver();

const runtimeDiscovery =
  createRuntimeDiscovery(
    nodeStartCommandResolver
  );

const runtime =
  await runtimeDiscovery.discover(
    workspace
  );

console.log("RUNTIME:");
console.log(
  JSON.stringify(
    runtime,
    null,
    2
  )
);

if (runtime.type !== "NODE") {
  throw new Error(
    "Expected NODE runtime"
  );
}

const server =
  createNodeApplicationServer({
    runtime,
    port: 43130,
    readinessTimeoutMs: 10_000,
    readinessIntervalMs: 250,
  });

console.log("\nSTARTING SERVER...");

await server.start();

console.log("SERVER STARTED");
console.log(
  "isRunning =",
  server.isRunning()
);
console.log(
  "baseUrl =",
  server.baseUrl
);

console.log("\nSTOPPING SERVER...");

await server.stop();

console.log("SERVER STOPPED");
console.log(
  "isRunning =",
  server.isRunning()
);
