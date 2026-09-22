import { promises as fs } from "node:fs";
import path from "node:path";
import type { DatabaseManager } from "./database-manager.js";

export interface Migration {
  id: string;
  name: string;
  sql: string;
}

export interface MigrationStatus {
  id: string;
  name: string;
  applied: boolean;
}

export interface MigrationManager {
  ensureMigrationTable(): Promise<void>;
  apply(migrations: readonly Migration[]): Promise<void>;
  status(migrations: readonly Migration[]): Promise<MigrationStatus[]>;
}

const MIGRATION_TABLE = "schema_migrations";

function validateMigration(
  migration: Migration
): void {
  if (migration.id.trim() === "") {
    throw new Error(
      "Migration ID must not be empty"
    );
  }

  if (migration.name.trim() === "") {
    throw new Error(
      "Migration name must not be empty"
    );
  }

  if (migration.sql.trim() === "") {
    throw new Error(
      "Migration SQL must not be empty"
    );
  }
}

async function ensureMigrationTable(
  database: DatabaseManager
): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export function createMigrationManager(
  database: DatabaseManager
): MigrationManager {
  return {
    async ensureMigrationTable(): Promise<void> {
      await ensureMigrationTable(database);
    },

    async apply(
      migrations: readonly Migration[]
    ): Promise<void> {
      await ensureMigrationTable(database);

      for (const migration of migrations) {
        validateMigration(migration);

        const result = await database.query<{
          id: string;
        }>(
          `SELECT id FROM ${MIGRATION_TABLE} WHERE id = $1`,
          [migration.id]
        );

        if (result.rows.length > 0) {
          continue;
        }

        await database.transaction(
          async (transaction) => {
            await transaction.query(
              migration.sql
            );

            await transaction.query(
              `
                INSERT INTO ${MIGRATION_TABLE}
                  (id, name)
                VALUES
                  ($1, $2)
              `,
              [
                migration.id,
                migration.name,
              ]
            );
          }
        );
      }
    },

    async status(
      migrations: readonly Migration[]
    ): Promise<MigrationStatus[]> {
      await ensureMigrationTable(database);

      const result = await database.query<{
        id: string;
      }>(
        `SELECT id FROM ${MIGRATION_TABLE}`
      );

      const appliedIds = new Set(
        result.rows.map((row) => row.id)
      );

      return migrations.map((migration) => {
        validateMigration(migration);

        return {
          id: migration.id,
          name: migration.name,
          applied: appliedIds.has(
            migration.id
          ),
        };
      });
    },
  };
}

export async function loadMigrations(
  directory: string
): Promise<Migration[]> {
  const entries = await fs.readdir(
    directory,
    {
      withFileTypes: true,
    }
  );

  const migrations: Migration[] = [];

  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".sql")
    ) {
      continue;
    }

    const filePath = path.join(
      directory,
      entry.name
    );

    const sql = await fs.readFile(
      filePath,
      "utf8"
    );

    const name = entry.name.replace(
      /\.sql$/i,
      ""
    );

    migrations.push({
      id: name,
      name,
      sql,
    });
  }

  migrations.sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  return migrations;
}
