import { runPipelineBenchmark } from "./pipeline-benchmark.js";

const result = await runPipelineBenchmark({
  id: "layer10-node-smoke-test",
  prompt: "Create a minimal Node.js web application with a page that displays Hello World.",
});

console.log(JSON.stringify(result, null, 2));
