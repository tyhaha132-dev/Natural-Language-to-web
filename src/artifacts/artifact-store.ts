import { promises as fs } from "node:fs";
import {
  getArtifactPath,
  getPipelineArtifactDirectory,
} from "./artifact-path.js";

export async function writeArtifact(
  pipelineId: string,
  artifactName: string,
  content: string
): Promise<void> {
  const directory =
    getPipelineArtifactDirectory(pipelineId);

  await fs.mkdir(directory, {
    recursive: true,
  });

  await fs.writeFile(
    getArtifactPath(pipelineId, artifactName),
    content,
    "utf8"
  );
}

export async function readArtifact(
  pipelineId: string,
  artifactName: string
): Promise<string> {
  return fs.readFile(
    getArtifactPath(pipelineId, artifactName),
    "utf8"
  );
}

export async function artifactExists(
  pipelineId: string,
  artifactName: string
): Promise<boolean> {
  try {
    await fs.access(
      getArtifactPath(pipelineId, artifactName)
    );

    return true;
  } catch {
    return false;
  }
}
