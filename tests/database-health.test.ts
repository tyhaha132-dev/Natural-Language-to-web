import { describe, expect, it } from "vitest";
import { CONFIG } from "../src/config/config.js";
import {
  checkDatabaseHealth,
} from "../src/infrastructure/database/database-health.js";

describe("DatabaseHealth", () => {
  it("should connect to the configured PostgreSQL database", async () => {
    const result =
      await checkDatabaseHealth({
        host: CONFIG.postgres.host,
        port: CONFIG.postgres.port,
        database: CONFIG.postgres.database,
        user: CONFIG.postgres.user,
        password: CONFIG.postgres.password,
        timeoutMs: 3_000,
      });

    expect(result.available).toBe(true);
    expect(result.host).toBe(CONFIG.postgres.host);
    expect(result.port).toBe(CONFIG.postgres.port);
    expect(result.database).toBe(CONFIG.postgres.database);
    expect(result.user).toBe(CONFIG.postgres.user);
    expect(result.error).toBeNull();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should report authentication failure", async () => {
    const result =
      await checkDatabaseHealth({
        host: CONFIG.postgres.host,
        port: CONFIG.postgres.port,
        database: CONFIG.postgres.database,
        user: CONFIG.postgres.user,
        password: "definitely-invalid-password",
        timeoutMs: 3_000,
      });

    expect(result.available).toBe(false);
    expect(result.error).toContain(
      "password authentication failed"
    );
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should report an unavailable database endpoint", async () => {
    const result =
      await checkDatabaseHealth({
        host: "127.0.0.1",
        port: 65_534,
        database: CONFIG.postgres.database,
        user: CONFIG.postgres.user,
        password: CONFIG.postgres.password,
        timeoutMs: 500,
      });

    expect(result.available).toBe(false);
    expect(result.host).toBe("127.0.0.1");
    expect(result.port).toBe(65_534);
    expect(result.database).toBe(CONFIG.postgres.database);
    expect(result.user).toBe(CONFIG.postgres.user);
    expect(result.error).not.toBeNull();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
