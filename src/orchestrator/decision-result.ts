export type Decision =
  | "COMPLETE"
  | "RETRY"
  | "RETRY_REVIEW"
  | "FAIL";

export interface DecisionResult {
  decision: Decision;
  reason: string;
  decidedAt: string;
}

export function createDecisionResult(
  decision: Decision,
  reason: string
): DecisionResult {
  return {
    decision,
    reason,
    decidedAt:
      new Date().toISOString(),
  };
}
