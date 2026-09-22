import {
  checkEnvironment,
  type EnvironmentCheckResult,
} from "./environment-check.js";

export interface EnvironmentStatus {
  ready: boolean;
  checks: readonly EnvironmentCheckResult[];
  missing: readonly string[];
}

export async function inspectEnvironment(): Promise<EnvironmentStatus> {
  const checks = await checkEnvironment();

  const missing = checks
    .filter((check) => !check.available)
    .map((check) => check.name);

  return {
    ready: missing.length === 0,
    checks,
    missing,
  };
}
