import { describe, expect, it } from "vitest";
import path from "node:path";
import { PATHS } from "../src/config/paths.js";
import {
  getArtifactPath,
  getPipelineArtifactDirectory,
} from "../src/artifacts/artifact-path.js";

describe("Artifact paths", () => {
  it("should resolve a pipeline artifact directory", () => {
    expect(
      getPipelineArtifactDirectory("pipeline-123")
    ).toBe(
      path.join(
        PATHS.artifacts,
        "pipelines",
        "pipeline-123"
      )
    );
  });

  it("should resolve an artifact path", () => {
    expect(
      getArtifactPath(
        "pipeline-123",
        "plan.json"
      )
    ).toBe(
      path.join(
        PATHS.artifacts,
        "pipelines",
        "pipeline-123",
        "plan.json"
      )
    );
  });

  it("should keep artifacts isolated by pipeline", () => {
    const first = getArtifactPath(
      "pipeline-123",
      "plan.json"
    );

    const second = getArtifactPath(
      "pipeline-456",
      "plan.json"
    );

    expect(first).not.toBe(second);
  });
});
