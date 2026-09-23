import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DatabaseManager,
} from "../src/infrastructure/database/database-manager.js";

import {
  DatabaseSetupStep,
} from "../src/orchestrator/database-setup-step.js";

import {
  createPipelineExecutionContext,
} from "../src/orchestrator/pipeline-execution-context.js";

function createMockDatabaseManager(
  overrides: Partial<DatabaseManager> = {}
): DatabaseManager {
  return {
    async connect(): Promise<void> {},
    
    async query() {
      return {
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        rows: [],
        fields: [],
      };
    },

    async transaction<T>(
      callback: (
        query: {
          query: DatabaseManager["query"];
        }
      ) => Promise<T>
    ): Promise<T> {
      return callback({
        query: async () => ({
          command: "SELECT",
          rowCount: 1,
          oid: 0,
          rows: [],
          fields: [],
        }),
      });
    },

    async health() {
      return {
        available: true,
        host: "localhost",
        port: 5432,
        database: "testdb",
        user: "postgres",
        error: null,
        durationMs: 5,
      };
    },

    async close(): Promise<void> {},

    ...overrides,
  };
}

describe("DatabaseSetupStep", () => {
  it("should connect and store database result", async () => {
    let connectCalled = false;

    const databaseManager =
      createMockDatabaseManager({
        async connect(): Promise<void> {
          connectCalled = true;
        },
      });

    const step =
      new DatabaseSetupStep(
        databaseManager
      );

    const context =
      createPipelineExecutionContext({
        id: "database-test-1",
        prompt: "Build a web app",
      });

    const result =
      await step.execute(context);

    expect(
      connectCalled
    ).toBe(true);

    expect(
      result.databaseResult
    ).not.toBeNull();

    expect(
      result.databaseResult?.available
    ).toBe(true);

    expect(
      result.databaseResult?.host
    ).toBe("localhost");

    expect(
      result.databaseResult?.port
    ).toBe(5432);

    expect(
      result.databaseResult?.database
    ).toBe("testdb");
  });

  it("should fail when database is unavailable", async () => {
    const databaseManager =
      createMockDatabaseManager({
        async health() {
          return {
            available: false,
            host: "localhost",
            port: 5432,
            database: "testdb",
            user: "postgres",
            error:
              "Connection refused",
            durationMs: 10,
          };
        },
      });

    const step =
      new DatabaseSetupStep(
        databaseManager
      );

    const context =
      createPipelineExecutionContext({
        id: "database-test-2",
        prompt: "Build a web app",
      });

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "Connection refused"
    );
  });

  it("should propagate connection failure", async () => {
    const databaseManager =
      createMockDatabaseManager({
        async connect(): Promise<void> {
          throw new Error(
            "Database connection failed"
          );
        },
      });

    const step =
      new DatabaseSetupStep(
        databaseManager
      );

    const context =
      createPipelineExecutionContext({
        id: "database-test-3",
        prompt: "Build a web app",
      });

    await expect(
      step.execute(context)
    ).rejects.toThrow(
      "Database connection failed"
    );
  });
});
