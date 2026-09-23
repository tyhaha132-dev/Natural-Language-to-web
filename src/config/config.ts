import "dotenv/config";

function readPositiveInteger(
  name: string,
  fallback: number
): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Environment variable ${name} must be a positive integer`
    );
  }

  return parsed;
}

function readString(
  name: string,
  fallback: string
): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value;
}

export function loadConfig() {
  return {
    nodeEnv: readString("NODE_ENV", "development"),

    pipeline: {
      maxIterations: readPositiveInteger(
        "PIPELINE_MAX_ITERATIONS",
        5
      ),
      processTimeoutMs: readPositiveInteger(
        "PROCESS_TIMEOUT_MS",
        600_000
      ),
    },

    server: {
      readinessTimeoutMs: readPositiveInteger(
        "SERVER_READINESS_TIMEOUT_MS",
        30_000
      ),
      readinessIntervalMs: readPositiveInteger(
        "SERVER_READINESS_INTERVAL_MS",
        250
      ),
    },

    postgres: {
      host: readString("POSTGRES_HOST", "localhost"),
      port: readPositiveInteger("POSTGRES_PORT", 5432),
      user: readString("POSTGRES_USER", "postgres"),
      password: readString("POSTGRES_PASSWORD", ""),
      database: readString(
        "POSTGRES_DB",
        "web_coding_agent"
      ),
    },
  } as const;
}

export const CONFIG = loadConfig();
