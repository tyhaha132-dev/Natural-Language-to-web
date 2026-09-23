export type ReviewStatus =
  | "APPROVED"
  | "CHANGES_REQUIRED"
  | "FAILED";

export interface ReviewResult {
  status: ReviewStatus;
  output: string;
  issues: string[];
  reviewedAt: string;
}

export function createReviewResult(
  output: string,
  status: ReviewStatus,
  issues: string[] = []
): ReviewResult {
  return {
    status,
    output,
    issues,
    reviewedAt:
      new Date().toISOString(),
  };
}
