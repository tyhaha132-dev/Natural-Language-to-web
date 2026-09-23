import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPipelineOrchestrator,
} from "../src/application/create-pipeline-orchestrator.js";

describe("createPipelineOrchestrator", () => {
  it("should create a pipeline orchestrator", () => {
    const orchestrator =
      createPipelineOrchestrator();

    expect(orchestrator).toBeDefined();

    expect(
      typeof orchestrator.execute
    ).toBe("function");
  });
});
