export type AgentStatus =
  | "SUCCESS"
  | "FAILURE";

export interface AgentResult {
  status: AgentStatus;
  output: string;
  error: string | null;
  durationMs: number;
}
