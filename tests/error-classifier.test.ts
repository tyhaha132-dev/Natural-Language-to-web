import { describe, expect, it } from "vitest";
import {
  ERROR_CODES,
} from "../src/errors/error-codes.js";
import { classifyError } from "../src/errors/error-classifier.js";
import { PipelineError } from "../src/errors/pipeline-error.js";

describe("Error classifier", () => {
  it("should preserve a PipelineError code", () => {
    const error = new PipelineError(
      ERROR_CODES.REVIEW_FAILURE,
      "Reviewer rejected the changes"
    );

    expect(classifyError(error)).toBe(
      ERROR_CODES.REVIEW_FAILURE
    );
  });

  it("should classify timeout errors", () => {
    expect(
      classifyError(new Error("Process timed out"))
    ).toBe(ERROR_CODES.TIMEOUT);

    expect(
      classifyError(new Error("Request timeout"))
    ).toBe(ERROR_CODES.TIMEOUT);
  });

  it("should classify database errors", () => {
    expect(
      classifyError(
        new Error("Postgres connection refused")
      )
    ).toBe(ERROR_CODES.DATABASE_FAILURE);

    expect(
      classifyError(
        new Error("Database is unavailable")
      )
    ).toBe(ERROR_CODES.DATABASE_FAILURE);
  });

  it("should classify build errors", () => {
    expect(
      classifyError(new Error("Build failed"))
    ).toBe(ERROR_CODES.BUILD_FAILURE);
  });

  it("should classify test errors", () => {
    expect(
      classifyError(new Error("Tests failed"))
    ).toBe(ERROR_CODES.TEST_FAILURE);
  });

  it("should classify invalid plan errors", () => {
    expect(
      classifyError(new Error("Invalid plan"))
    ).toBe(ERROR_CODES.PLAN_INVALID);
  });

  it("should classify unknown errors as process errors", () => {
    expect(
      classifyError(new Error("Something unexpected happened"))
    ).toBe(ERROR_CODES.PROCESS_ERROR);
  });

  it("should classify non-Error values as process errors", () => {
    expect(classifyError("unexpected")).toBe(
      ERROR_CODES.PROCESS_ERROR
    );
  });
});
