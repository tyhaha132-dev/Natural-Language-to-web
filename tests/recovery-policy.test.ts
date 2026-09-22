import { describe, expect, it } from "vitest";
import {
  ERROR_CODES,
} from "../src/errors/error-codes.js";
import { isRetryable } from "../src/errors/recovery-policy.js";

describe("Recovery policy", () => {
  it("should mark recoverable errors as retryable", () => {
    const retryableCodes = [
      ERROR_CODES.MODEL_ERROR,
      ERROR_CODES.PROCESS_ERROR,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.BUILD_FAILURE,
      ERROR_CODES.TEST_FAILURE,
      ERROR_CODES.DATABASE_FAILURE,
      ERROR_CODES.REVIEW_FAILURE,
    ];

    for (const code of retryableCodes) {
      expect(isRetryable(code)).toBe(true);
    }
  });

  it("should mark terminal errors as non-retryable", () => {
    const terminalCodes = [
      ERROR_CODES.PLAN_INVALID,
      ERROR_CODES.ENVIRONMENT_FAILURE,
      ERROR_CODES.MAX_ITERATIONS,
    ];

    for (const code of terminalCodes) {
      expect(isRetryable(code)).toBe(false);
    }
  });
});
