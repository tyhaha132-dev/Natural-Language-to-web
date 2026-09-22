import { describe, expect, it } from "vitest";
import { createDatabaseManager } from "../src/infrastructure/database/database-manager.js";

describe("DatabaseManager", () => {
  it("should connect to PostgreSQL", async () => {
    const database = createDatabaseManager();

    await database.connect();

    const result = await database.query<{
      current_database: string;
    }>("SELECT current_database()");

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.current_database).toBe(
      "web_coding_agent"
    );

    await database.close();
  });

  it("should allow connect to be called more than once", async () => {
    const database = createDatabaseManager();

    await database.connect();
    await database.connect();

    const result = await database.query<{
      value: number;
    }>("SELECT 1 AS value");

    expect(result.rows[0]?.value).toBe(1);

    await database.close();
  });

  it("should execute parameterized queries", async () => {
    const database = createDatabaseManager();

    await database.connect();

    const result = await database.query<{
      value: number;
    }>(
      "SELECT $1::integer AS value",
      [42]
    );

    expect(result.rows[0]?.value).toBe(42);

    await database.close();
  });

  it("should report database health", async () => {
    const database = createDatabaseManager();

    const result = await database.health();

    expect(result.available).toBe(true);
    expect(result.database).toBe(
      "web_coding_agent"
    );
    expect(result.user).toBe("postgres");
    expect(result.error).toBeNull();

    await database.close();
  });

  it("should reject queries before connect", async () => {
    const database = createDatabaseManager();

    await expect(
      database.query("SELECT 1")
    ).rejects.toThrow(
      "DatabaseManager is not connected"
    );

    await database.close();
  });

  it("should allow close to be called more than once", async () => {
    const database = createDatabaseManager();

    await database.connect();

    await database.close();
    await expect(database.close()).resolves.toBeUndefined();
  });
});
