import { pathToFileURL } from "node:url";

export function getSystemName(): string {
  return "web-coding-agent";
}

export interface AgentCliOptions {
  readonly id: string;
  readonly prompt: string;
  readonly port?: number;
}

function readFlag(
  args: readonly string[],
  name: string
): string | undefined {
  const prefix = `--${name}=`;

  for (const arg of args) {
    if (arg.startsWith(prefix)) {
      return arg.slice(
        prefix.length
      );
    }
  }

  const flag = `--${name}`;
  const index = args.indexOf(flag);

  if (
    index !== -1 &&
    index + 1 < args.length
  ) {
    return args[index + 1];
  }

  return undefined;
}

export function parseAgentCliArgs(
  argv: readonly string[]
): AgentCliOptions {
  const id = readFlag(argv, "id")?.trim() ?? "";
  const prompt =
    readFlag(argv, "prompt")?.trim() ??
    "";
  const portRaw = readFlag(
    argv,
    "port"
  )?.trim();

  if (id.length === 0) {
    throw new Error(
      'Missing required argument: --id <pipeline-id> (letters, numbers, dashes and underscores only)'
    );
  }

  if (
    id === "." ||
    id === ".." ||
    id.includes("/") ||
    id.includes("\\") ||
    id.includes("..") ||
    !/^[A-Za-z0-9_-]+$/.test(id)
  ) {
    throw new Error(
      `Invalid pipeline id: ${id}`
    );
  }

  if (prompt.length === 0) {
    throw new Error(
      "Missing required argument: --prompt <natural language requirement>"
    );
  }

  if (
    portRaw === undefined ||
    portRaw === ""
  ) {
    return { id, prompt };
  }

  const port = Number(portRaw);

  if (
    !Number.isInteger(port) ||
    port <= 0 ||
    port > 65535
  ) {
    throw new Error(
      `Invalid port: ${portRaw}`
    );
  }

  return { id, prompt, port };
}

async function main(
  argv: readonly string[]
): Promise<number> {
  let options: AgentCliOptions;

  try {
    options = parseAgentCliArgs(argv);
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : String(error)
    );
    console.error(
      'Usage: npm run agent -- --id <pipeline-id> --prompt "<requirement>" [--port <port>]'
    );

    return 2;
  }

  if (options.port !== undefined) {
    process.env.APPLICATION_PORT =
      String(options.port);
  }

  const { createPipelineOrchestrator } =
    await import(
      "./application/create-pipeline-orchestrator.js"
    );

  const { savePipelineRunReport } =
    await import(
      "./artifacts/pipeline-report.js"
    );

  const request = {
    id: options.id,
    prompt: options.prompt,
  };

  const orchestrator =
    createPipelineOrchestrator();

  const result =
    await orchestrator.execute(
      request
    );

  const reportPath =
    await savePipelineRunReport(
      request,
      result
    );

  console.log(
    JSON.stringify(
      {
        reportPath,
        status: result.status,
        durationMs:
          result.durationMs,
        workspace:
          result.context.workspace,
        failureReason:
          result.context.failureReason,
      },
      null,
      2
    )
  );

  return result.status ===
    "COMPLETED"
    ? 0
    : 1;
}

if (
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(
      process.argv[1]
    ).href
) {
  const exitCode = await main(
    process.argv.slice(2)
  );

  process.exitCode = exitCode;
}
