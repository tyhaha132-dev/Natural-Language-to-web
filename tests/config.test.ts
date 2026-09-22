import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/config.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Configuration", () => {
  it("should use default values", () => {
    delete process.env.NODE_ENV;
    delete process.env.PIPELINE_MAX_ITERATIONS;
    delete process.env.PROCESS_TIMEOUT_MS;
    delete process.env.POSTGRES_HOST;
    delete process.env.POSTGRES_PORT;
    delete process.env.POSTGRES_USER;
    delete process.env.POSTGRES_PASSWORD;
    delete process.env.POSTGRES_DB;

    const config = loadConfig();

    expect(config.nodeEnv).toBe("development");
    expect(config.pipeline.maxIterations).toBe(5);
    expect(config.pipeline.processTimeoutMs).toBe(600_000);
    expect(config.postgres.host).toBe("localhost");
    expect(config.postgres.port).toBe(5432);
    expect(config.postgres.user).toBe("postgres");
    expect(config.postgres.password).toBe("");
    expect(config.postgres.database).toBe("web_coding_agent");
  });

  it("should read environment variables", () => {
    process.env.NODE_ENV = "test";
    process.env.PIPELINE_MAX_ITERATIONS = "7";
    process.env.PROCESS_TIMEOUT_MS = "120000";
    process.env.POSTGRES_HOST = "db.example";
    process.env.POSTGRES_PORT = "5433";
    process.env.POSTGRES_USER = "agent";
    process.env.POSTGRES_PASSWORD = "secret";
    process.env.POSTGRES_DB = "agent_db";

    const config = loadConfig();

    expect(config.nodeEnv).toBe("test");
    expect(config.pipeline.maxIterations).toBe(7);
    expect(config.pipeline.processTimeoutMs).toBe(120000);
    expect(config.postgres.host).toBe("db.example");
    expect(config.postgres.port).toBe(5433);
    expect(config.postgres.user).toBe("agent");
    expect(config.postgres.password).toBe("secret");
    expect(config.postgres.database).toBe("agent_db");
  });
});
