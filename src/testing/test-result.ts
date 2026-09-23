import type {
  ProcessResult,
} from "../runtime/process-result.js";

export type TestStatus =
  | "PASSED"
  | "FAILED"
  | "TIMED_OUT";

export interface TestResult {
  status: TestStatus;
  command: string;
  args: readonly string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export function createTestResult(
  processResult: ProcessResult
): TestResult {
  let status: TestStatus;

  if (processResult.timedOut) {
    status = "TIMED_OUT";
  } else if (processResult.exitCode === 0) {
    status = "PASSED";
  } else {
    status = "FAILED";
  }

  return {
    status,
    command: processResult.command,
    args: processResult.args,
    exitCode: processResult.exitCode,
    stdout: processResult.stdout,
    stderr: processResult.stderr,
    durationMs: processResult.durationMs,
  };
}
