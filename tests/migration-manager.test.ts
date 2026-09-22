import { describe, expect, it } from "vitest";
import { createDatabaseManager } from "../src/infrastructure/database/database-manager.js";
import {
  createMigrationManager,
  loadMigrations,
  type Migration,
} from "../src/infrastructure/database/migration-manager.js";

describe("MigrationManager", () => {
  it("should create the migration table", async () => {
    const database = createDatabaseManager();
    await database.connect();

    const migrations =
      createMigrationManager(database);

    await migrations.ensureMigrationTable();

    const result = await database.query<{
      exists: boolean;
    }>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'schema_migrations'
      ) AS exists
    `);

    expect(result.rows[0]?.exists).toBe(true);

    await database.close();
  });

  it("should apply a migration", async () => {
    const database = createDatabaseManager();
    await database.connect();

    const migrations =
      createMigrationManager(database);

    const migration: Migration = {
      id: "test_001",
      name: "test_001_create_table",
      sql: `
        CREATE TABLE IF NOT EXISTS migration_test_001 (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL
        )
      `,
    };

    await migrations.apply([migration]);

    const result = await database.query<{
      exists: boolean;
    }>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'migration_test_001'
      ) AS exists
    `);

    expect(result.rows[0]?.exists).toBe(true);

    await database.close();
  });

  it("should not apply the same migration twice", async () => {
    const database = createDatabaseManager();
    await database.connect();

    const migrations =
      createMigrationManager(database);

    const migration: Migration = {
      id: "test_002",
      name: "test_002_create_table",
      sql: `
        CREATE TABLE IF NOT EXISTS migration_test_002 (
          id SERIAL PRIMARY KEY
        )
      `,
    };

    await migrations.apply([migration]);
    await migrations.apply([migration]);

    const result = await database.query<{
      count: string;
    }>(
      `
        SELECT COUNT(*)::text AS count
        FROM schema_migrations
        WHERE id = $1
      `,
      [migration.id]
    );

    expect(result.rows[0]?.count).toBe("1");

    await database.close();
  });

  it("should report migration status", async () => {
    const database = createDatabaseManager();
    await database.connect();

    const migrations =
      createMigrationManager(database);

    const applied: Migration = {
      id: "test_003",
      name: "test_003_applied",
      sql: `
        CREATE TABLE IF NOT EXISTS migration_test_003 (
          id SERIAL PRIMARY KEY
        )
      `,
    };

    const pending: Migration = {
      id: "test_004",
      name: "test_004_pending",
      sql: `
        CREATE TABLE IF NOT EXISTS migration_test_004 (
          id SERIAL PRIMARY KEY
        )
      `,
    };

    await migrations.apply([applied]);

    const status =
      await migrations.status([
        applied,
        pending,
      ]);

    expect(status).toEqual([
      {
        id: "test_003",
        name: "test_003_applied",
        applied: true,
      },
      {
        id: "test_004",
        name: "test_004_pending",
        applied: false,
      },
    ]);

    await database.close();
  });

  it("should rollback a failed migration", async () => {
    const database = createDatabaseManager();
    await database.connect();

    const migrations =
      createMigrationManager(database);

    const migration: Migration = {
      id: "test_005",
      name: "test_005_failed",
      sql: `
        CREATE TABLE migration_test_005 (
          id SERIAL PRIMARY KEY
        );

        THIS IS INVALID SQL;
      `,
    };

    await expect(
      migrations.apply([migration])
    ).rejects.toThrow();

    const migrationRecord =
      await database.query<{
        count: string;
      }>(
        `
          SELECT COUNT(*)::text AS count
          FROM schema_migrations
          WHERE id = $1
        `,
        [migration.id]
      );

    expect(
      migrationRecord.rows[0]?.count
    ).toBe("0");

    const tableResult =
      await database.query<{
        exists: boolean;
      }>(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'migration_test_005'
        ) AS exists
      `);

    expect(
      tableResult.rows[0]?.exists
    ).toBe(false);

    await database.close();
  });

  it("should load and sort SQL migrations", async () => {
    const fs = await import("node:fs/promises");
    const os = await import("node:os");
    const path = await import("node:path");

    const directory =
      await fs.mkdtemp(
        path.join(
          os.tmpdir(),
          "migration-manager-"
        )
      );

    try {
      await fs.writeFile(
        path.join(
          directory,
          "002_second.sql"
        ),
        "SELECT 2;",
        "utf8"
      );

      await fs.writeFile(
        path.join(
          directory,
          "001_first.sql"
        ),
        "SELECT 1;",
        "utf8"
      );

      await fs.writeFile(
        path.join(
          directory,
          "notes.txt"
        ),
        "ignore me",
        "utf8"
      );

      const migrations =
        await loadMigrations(directory);

      expect(migrations).toEqual([
        {
          id: "001_first",
          name: "001_first",
          sql: "SELECT 1;",
        },
        {
          id: "002_second",
          name: "002_second",
          sql: "SELECT 2;",
        },
      ]);
    } finally {
      await fs.rm(directory, {
        recursive: true,
        force: true,
      });
    }
  });
});
