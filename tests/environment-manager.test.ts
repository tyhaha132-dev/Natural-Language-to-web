import { describe, expect, it, vi } from "vitest";

const { checkEnvironmentMock } = vi.hoisted(() => ({
  checkEnvironmentMock: vi.fn(),
}));

vi.mock(
  "../src/infrastructure/environment/environment-check.js",
  () => ({
    checkEnvironment: checkEnvironmentMock,
  })
);

import { inspectEnvironment } from "../src/infrastructure/environment/environment-manager.js";

describe("EnvironmentManager", () => {
  it("should report a ready environment when all checks pass", async () => {
    checkEnvironmentMock.mockResolvedValue([
      {
        name: "node",
        available: true,
        version: "v22.23.2",
        error: null,
      },
      {
        name: "npm",
        available: true,
        version: "10.9.8",
        error: null,
      },
      {
        name: "docker",
        available: true,
        version: "Docker version 28",
        error: null,
      },
    ]);

    const result = await inspectEnvironment();

    expect(result.ready).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.checks).toHaveLength(3);
  });

  it("should report missing dependencies", async () => {
    checkEnvironmentMock.mockResolvedValue([
      {
        name: "node",
        available: true,
        version: "v22.23.2",
        error: null,
      },
      {
        name: "npm",
        available: true,
        version: "10.9.8",
        error: null,
      },
      {
        name: "docker",
        available: false,
        version: null,
        error: "spawn docker ENOENT",
      },
    ]);

    const result = await inspectEnvironment();

    expect(result.ready).toBe(false);
    expect(result.missing).toEqual(["docker"]);
  });

  it("should preserve all environment check results", async () => {
    const checks = [
      {
        name: "node",
        available: true,
        version: "v22.23.2",
        error: null,
      },
      {
        name: "npm",
        available: false,
        version: null,
        error: "npm unavailable",
      },
    ];

    checkEnvironmentMock.mockResolvedValue(checks);

    const result = await inspectEnvironment();

    expect(result.checks).toEqual(checks);
    expect(result.missing).toEqual(["npm"]);
  });
});
