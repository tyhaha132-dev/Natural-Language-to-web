import {
  ERROR_CODES,
  type ErrorCode,
} from "./error-codes.js";
import { PipelineError } from "./pipeline-error.js";

export function classifyError(error: unknown): ErrorCode {
  if (error instanceof PipelineError) {
    return error.code;
  }

  if (!(error instanceof Error)) {
    return ERROR_CODES.PROCESS_ERROR;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return ERROR_CODES.TIMEOUT;
  }

  if (
    message.includes("database") ||
    message.includes("postgres") ||
    message.includes("connection refused")
  ) {
    return ERROR_CODES.DATABASE_FAILURE;
  }

  if (
    message.includes("build failed") ||
    message.includes("build failure")
  ) {
    return ERROR_CODES.BUILD_FAILURE;
  }

  if (
    message.includes("test failed") ||
    message.includes("tests failed")
  ) {
    return ERROR_CODES.TEST_FAILURE;
  }

  if (
    message.includes("plan invalid") ||
    message.includes("invalid plan")
  ) {
    return ERROR_CODES.PLAN_INVALID;
  }

  return ERROR_CODES.PROCESS_ERROR;
}
