import { createNodeApplicationServer } from "../runtime/node-application-server.js";
import { createNodeStartCommandResolver } from "../runtime/node-start-command-resolver.js";
import { createRuntimeDiscovery } from "../runtime/runtime-discovery.js";
import { createTestRunner } from "../testing/test-runner.js";

const workspace =
  "D:\\project\\web-coding-agent\\workspaces\\layer10-node-smoke-test";

const runtimeDiscovery =
  createRuntimeDiscovery(
    createNodeStartCommandResolver()
  );

const runtime =
  await runtimeDiscovery.discover(
    workspace
  );

if (runtime.type !== "NODE") {
  throw new Error("Expected NODE runtime");
}

const server =
  createNodeApplicationServer({
    runtime,
    port: 43130,
    readinessTimeoutMs: 10_000,
    readinessIntervalMs: 250,
  });

console.log("1. Starting server...");
await server.start();

console.log("2. Server started:", server.isRunning());

const testRunner =
  createTestRunner({
    timeoutMs: 10_000,
  });

console.log("3. Running failing npm test...");

const result =
  await testRunner.run(
    workspace,
    {
      command:
        process.platform === "win32"
          ? "npm.cmd"
          : "npm",
      args: ["test"],
    }
  );

console.log(
  "4. npm test returned:",
  JSON.stringify(result, null, 2)
);

console.log("5. Calling server.stop()...");

const stopStartedAt =
  Date.now();

await server.stop();

console.log(
  "6. server.stop() returned after",
  `${Date.now() - stopStartedAt}ms`
);

console.log(
  "7. Server running:",
  server.isRunning()
);
