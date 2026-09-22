export interface ProcessResult {
  command: string;
  args: readonly string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
}
