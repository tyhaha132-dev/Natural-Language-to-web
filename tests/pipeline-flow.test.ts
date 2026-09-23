import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PIPELINE_FLOW,
} from "../src/orchestrator/pipeline-flow.js";

describe("PIPELINE_FLOW", () => {
  it("should define the pipeline states in order", () => {
    expect(PIPELINE_FLOW).toEqual([
      "STARTING",
      "ANALYZING",
      "ENVIRONMENT_SETUP",
      "PLANNING",
      "PLAN_VALIDATING",
      "CODING",
      "DATABASE_SETUP",
      "TESTING",
      "REVIEWING",
      "DECIDING",
    ]);
  });

  it("should not include terminal states", () => {
    expect(
      PIPELINE_FLOW
    ).not.toContain("COMPLETED");

    expect(
      PIPELINE_FLOW
    ).not.toContain("FAILED");
  });

  it("should contain each state only once", () => {
    expect(
      new Set(PIPELINE_FLOW).size
    ).toBe(PIPELINE_FLOW.length);
  });
});
