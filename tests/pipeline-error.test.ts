import { describe, expect, it } from "vitest";
import { ERROR_CODES } from "../src/errors/error-codes.js";
import { PipelineError } from "../src/errors/pipeline-error.js";

describe("PipelineError", () => {
  it("should create a pipeline error", () => {
    const error = new PipelineError(
      ERROR_CODES.TEST_FAILURE,
      "Tests failed"
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PipelineError);
    expect(error.name).toBe("PipelineError");
    expect(error.code).toBe(ERROR_CODES.TEST_FAILURE);
    expect(error.message).toBe("Tests failed");
    expect(error.cause).toBeUndefined();
  });

  it("should preserve the original cause", () => {
    const cause = new Error("Connection refused");

    const error = new PipelineError(
      ERROR_CODES.DATABASE_FAILURE,
      "Database connection failed",
      cause
    );

    expect(error.code).toBe(
      ERROR_CODES.DATABASE_FAILURE
    );
    expect(error.message).toBe(
      "Database connection failed"
    );
    expect(error.cause).toBe(cause);
  });
});
