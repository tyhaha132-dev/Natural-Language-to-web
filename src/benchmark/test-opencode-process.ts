import { resolveOpenCodeExecutable } from "../runtime/opencode-resolver.js";
import { runProcess } from "../runtime/process-runner.js";

const executable = await resolveOpenCodeExecutable();

console.log("EXECUTABLE:");
console.log(executable);

console.log("\nSTARTING runProcess...\n");

const result = await runProcess(
  executable,
  [
    "run",
    "--auto",
    "--model",
    "opencode/mimo-v2.6-flash-free",
    "Inspect the current workspace. Reply with exactly APPROVED.",
  ],
  {
    cwd: process.cwd(),
    timeoutMs: 60_000,
  }
);

console.log("\nRESULT:");
console.log(JSON.stringify(result, null, 2));
