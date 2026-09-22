import pg from "pg";

export interface DatabaseHealthResult {
  available: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  error: string | null;
  durationMs: number;
}

export interface DatabaseHealthOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  timeoutMs?: number;
}

export async function checkDatabaseHealth(
  options: DatabaseHealthOptions
): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? 5_000;

  const client = new pg.Client({
    host: options.host,
    port: options.port,
    database: options.database,
    user: options.user,
    password: options.password,
    connectionTimeoutMillis: timeoutMs,
  });

  try {
    await client.connect();

    await client.query("SELECT 1");

    return {
      available: true,
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      error: null,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      available: false,
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      error:
        error instanceof Error
          ? error.message
          : String(error),
      durationMs: Date.now() - startTime,
    };
  } finally {
    await client.end().catch(() => {});
  }
}
