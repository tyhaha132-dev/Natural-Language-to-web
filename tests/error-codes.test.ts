import { describe, expect, it } from "vitest";
import {
  ERROR_CODES,
  type ErrorCode,
} from "../src/errors/error-codes.js";

describe("Error codes", () => {
  it("should define all pipeline error codes", () => {
    const codes: ErrorCode[] = [
      ERROR_CODES.MODEL_ERROR,
      ERROR_CODES.PROCESS_ERROR,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.PLAN_INVALID,
      ERROR_CODES.BUILD_FAILURE,
      ERROR_CODES.TEST_FAILURE,
      ERROR_CODES.DATABASE_FAILURE,
      ERROR_CODES.ENVIRONMENT_FAILURE,
      ERROR_CODES.REVIEW_FAILURE,
      ERROR_CODES.MAX_ITERATIONS,
    ];

    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });

  it("should use stable string values", () => {
    expect(ERROR_CODES.MODEL_ERROR).toBe("MODEL_ERROR");
    expect(ERROR_CODES.PROCESS_ERROR).toBe("PROCESS_ERROR");
    expect(ERROR_CODES.TIMEOUT).toBe("TIMEOUT");
    expect(ERROR_CODES.PLAN_INVALID).toBe("PLAN_INVALID");
    expect(ERROR_CODES.BUILD_FAILURE).toBe("BUILD_FAILURE");
    expect(ERROR_CODES.TEST_FAILURE).toBe("TEST_FAILURE");
    expect(ERROR_CODES.DATABASE_FAILURE).toBe(
      "DATABASE_FAILURE"
    );
    expect(ERROR_CODES.ENVIRONMENT_FAILURE).toBe(
      "ENVIRONMENT_FAILURE"
    );
    expect(ERROR_CODES.REVIEW_FAILURE).toBe(
      "REVIEW_FAILURE"
    );
    expect(ERROR_CODES.MAX_ITERATIONS).toBe(
      "MAX_ITERATIONS"
    );
  });
});
