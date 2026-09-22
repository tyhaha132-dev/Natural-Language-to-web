import {
  ERROR_CODES,
} from "../errors/error-codes.js";
import {
  PipelineError,
} from "../errors/pipeline-error.js";

export interface IterationManager {
  getCurrent(): number;
  canContinue(): boolean;
  next(): number;
  assertCanContinue(): void;
}

export interface IterationManagerOptions {
  maxIterations: number;
}

export function createIterationManager(
  options: IterationManagerOptions
): IterationManager {
  if (
    !Number.isInteger(
      options.maxIterations
    ) ||
    options.maxIterations <= 0
  ) {
    throw new Error(
      "maxIterations must be a positive integer"
    );
  }

  let current = 0;

  return {
    getCurrent(): number {
      return current;
    },

    canContinue(): boolean {
      return current < options.maxIterations;
    },

    next(): number {
      if (current >= options.maxIterations) {
        throw new PipelineError(
          ERROR_CODES.MAX_ITERATIONS,
          `Maximum iterations reached: ${options.maxIterations}`
        );
      }

      current += 1;

      return current;
    },

    assertCanContinue(): void {
      if (
        current >=
        options.maxIterations
      ) {
        throw new PipelineError(
          ERROR_CODES.MAX_ITERATIONS,
          `Maximum iterations reached: ${options.maxIterations}`
        );
      }
    },
  };
}
