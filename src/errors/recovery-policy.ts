import {
  ERROR_CODES,
  type ErrorCode,
} from "./error-codes.js";

const RETRYABLE_ERRORS = new Set<ErrorCode>([
  ERROR_CODES.MODEL_ERROR,
  ERROR_CODES.PROCESS_ERROR,
  ERROR_CODES.TIMEOUT,
  ERROR_CODES.BUILD_FAILURE,
  ERROR_CODES.TEST_FAILURE,
  ERROR_CODES.DATABASE_FAILURE,
  ERROR_CODES.REVIEW_FAILURE,
]);

export function isRetryable(
  code: ErrorCode
): boolean {
  return RETRYABLE_ERRORS.has(code);
}
