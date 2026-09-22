import pg from "pg";
import { CONFIG } from "../../config/config.js";
import {
  checkDatabaseHealth,
  type DatabaseHealthResult,
} from "./database-health.js";

export interface DatabaseManager {
  connect(): Promise<void>;
  query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<pg.QueryResult<T>>;
  health(): Promise<DatabaseHealthResult>;
  close(): Promise<void>;
}

export function createDatabaseManager(): DatabaseManager {
  const pool = new pg.Pool({
    host: CONFIG.postgres.host,
    port: CONFIG.postgres.port,
    database: CONFIG.postgres.database,
    user: CONFIG.postgres.user,
    password: CONFIG.postgres.password,
  });

  let connected = false;
  let closed = false;

  return {
    async connect(): Promise<void> {
      if (closed) {
        throw new Error(
          "DatabaseManager is closed"
        );
      }

      if (connected) {
        return;
      }

      const client = await pool.connect();

      client.release();

      connected = true;
    },

    async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
      text: string,
      values: unknown[] = []
    ): Promise<pg.QueryResult<T>> {
      if (closed) {
        throw new Error(
          "DatabaseManager is closed"
        );
      }

      if (!connected) {
        throw new Error(
          "DatabaseManager is not connected"
        );
      }

      return pool.query<T>(text, values);
    },

    async health(): Promise<DatabaseHealthResult> {
      return checkDatabaseHealth({
        host: CONFIG.postgres.host,
        port: CONFIG.postgres.port,
        database: CONFIG.postgres.database,
        user: CONFIG.postgres.user,
        password: CONFIG.postgres.password,
      });
    },

    async close(): Promise<void> {
      if (closed) {
        return;
      }

      await pool.end();

      connected = false;
      closed = true;
    },
  };
}
