import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/config.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Configuration validation", () => {
  it("should reject zero iterations", () => {
    process.env.PIPELINE_MAX_ITERATIONS = "0";

    expect(() => loadConfig()).toThrow(
      "Environment variable PIPELINE_MAX_ITERATIONS must be a positive integer"
    );
  });

  it("should reject negative timeout", () => {
    process.env.PROCESS_TIMEOUT_MS = "-100";

    expect(() => loadConfig()).toThrow(
      "Environment variable PROCESS_TIMEOUT_MS must be a positive integer"
    );
  });

  it("should reject non-numeric postgres port", () => {
    process.env.POSTGRES_PORT = "abc";

    expect(() => loadConfig()).toThrow(
      "Environment variable POSTGRES_PORT must be a positive integer"
    );
  });
});
