import {
  runPipelineBenchmark,
} from "./pipeline-benchmark.js";

const result =
  await runPipelineBenchmark({
    id: "layer10-smoke-test",
    prompt:
      "Create a minimal web application with a single HTML page.",
  });

console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);
