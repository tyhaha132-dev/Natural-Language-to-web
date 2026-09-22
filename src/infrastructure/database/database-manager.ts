import pg from "pg";
import { CONFIG } from "../../config/config.js";
import {
  checkDatabaseHealth,
  type DatabaseHealthResult,
} from "./database-health.js";

export interface DatabaseQuery {
  query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<pg.QueryResult<T>>;
}

export interface DatabaseManager extends DatabaseQuery {
  connect(): Promise<void>;
  transaction<T>(
    callback: (query: DatabaseQuery) => Promise<T>
  ): Promise<T>;
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

  const query = async <
    T extends pg.QueryResultRow = pg.QueryResultRow
  >(
    text: string,
    values: unknown[] = []
  ): Promise<pg.QueryResult<T>> => {
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
  };

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

    query,

    async transaction<T>(
      callback: (
        transactionQuery: DatabaseQuery
      ) => Promise<T>
    ): Promise<T> {
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

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const transactionQuery: DatabaseQuery = {
          query: async <
            R extends pg.QueryResultRow = pg.QueryResultRow
          >(
            text: string,
            values: unknown[] = []
          ): Promise<pg.QueryResult<R>> => {
            return client.query<R>(text, values);
          },
        };

        const result =
          await callback(transactionQuery);

        await client.query("COMMIT");

        return result;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
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
