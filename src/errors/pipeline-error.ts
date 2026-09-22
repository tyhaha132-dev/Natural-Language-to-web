import type { ErrorCode } from "./error-codes.js";

export class PipelineError extends Error {
  readonly code: ErrorCode;
  readonly cause?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);

    this.name = "PipelineError";
    this.code = code;
    this.cause = cause;
  }
}
