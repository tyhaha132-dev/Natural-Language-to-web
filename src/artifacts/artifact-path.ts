import path from "node:path";
import { PATHS } from "../config/paths.js";

export function getPipelineArtifactDirectory(
  pipelineId: string
): string {
  return path.join(
    PATHS.artifacts,
    "pipelines",
    pipelineId
  );
}

export function getArtifactPath(
  pipelineId: string,
  artifactName: string
): string {
  return path.join(
    getPipelineArtifactDirectory(pipelineId),
    artifactName
  );
}
