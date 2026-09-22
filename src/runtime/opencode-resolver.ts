import { promises as fs } from "node:fs";
import path from "node:path";
import { runProcess } from "./process-runner.js";

export async function resolveOpenCodeExecutable(): Promise<string> {
  const result = await runProcess(
    "where.exe",
    ["opencode.cmd"],
    {
      timeoutMs: 5_000,
    }
  );

  if (
    result.timedOut ||
    result.exitCode !== 0 ||
    result.stdout.trim() === ""
  ) {
    throw new Error(
      "Unable to locate opencode.cmd"
    );
  }

  const commandPath = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (commandPath === undefined) {
    throw new Error(
      "Unable to determine opencode.cmd path"
    );
  }

  const commandDirectory = path.dirname(commandPath);

  const script = await fs.readFile(
    commandPath,
    "utf8"
  );

  const match = script.match(
    /["']%dp0%\\(.+?opencode\.exe)["']/i
  );

  if (match === null) {
    throw new Error(
      "Unable to resolve opencode.exe from opencode.cmd"
    );
  }

  const relativeExecutable = match[1].replace(
    /\\/g,
    path.sep
  );

  const executablePath = path.resolve(
    commandDirectory,
    relativeExecutable
  );

  return executablePath;
}
