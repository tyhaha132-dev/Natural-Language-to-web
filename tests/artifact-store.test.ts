import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import {
  artifactExists,
  readArtifact,
  writeArtifact,
} from "../src/artifacts/artifact-store.js";
import { getPipelineArtifactDirectory } from "../src/artifacts/artifact-path.js";

const pipelineId = "test-artifact-store";

afterEach(async () => {
  await fs.rm(
    getPipelineArtifactDirectory(pipelineId),
    {
      recursive: true,
      force: true,
    }
  );
});

describe("Artifact Store", () => {
  it("should write and read an artifact", async () => {
    const content = JSON.stringify({
      status: "passed",
      tests: 10,
    });

    await writeArtifact(
      pipelineId,
      "test-result.json",
      content
    );

    const result = await readArtifact(
      pipelineId,
      "test-result.json"
    );

    expect(result).toBe(content);
  });

  it("should report whether an artifact exists", async () => {
    expect(
      await artifactExists(
        pipelineId,
        "plan.json"
      )
    ).toBe(false);

    await writeArtifact(
      pipelineId,
      "plan.json",
      '{"valid":true}'
    );

    expect(
      await artifactExists(
        pipelineId,
        "plan.json"
      )
    ).toBe(true);
  });

  it("should isolate artifacts between pipelines", async () => {
    await writeArtifact(
      "pipeline-a",
      "plan.json",
      "plan-a"
    );

    await writeArtifact(
      "pipeline-b",
      "plan.json",
      "plan-b"
    );

    expect(
      await readArtifact(
        "pipeline-a",
        "plan.json"
      )
    ).toBe("plan-a");

    expect(
      await readArtifact(
        "pipeline-b",
        "plan.json"
      )
    ).toBe("plan-b");

    await fs.rm(
      getPipelineArtifactDirectory("pipeline-a"),
      {
        recursive: true,
        force: true,
      }
    );

    await fs.rm(
      getPipelineArtifactDirectory("pipeline-b"),
      {
        recursive: true,
        force: true,
      }
    );
  });
});
