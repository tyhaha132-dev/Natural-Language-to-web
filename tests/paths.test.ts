import { describe, expect, it } from "vitest";
import path from "node:path";
import { PATHS } from "../src/config/paths.js";

describe("Path configuration", () => {
  it("should resolve the project root", () => {
    expect(PATHS.projectRoot).toBe(process.cwd());
  });

  it("should resolve the source directory", () => {
    expect(PATHS.source).toBe(path.join(process.cwd(), "src"));
  });

  it("should resolve the tests directory", () => {
    expect(PATHS.tests).toBe(path.join(process.cwd(), "tests"));
  });

  it("should resolve the artifacts directory", () => {
    expect(PATHS.artifacts).toBe(path.join(process.cwd(), "artifacts"));
  });

  it("should resolve the workspaces directory", () => {
    expect(PATHS.workspaces).toBe(path.join(process.cwd(), "workspaces"));
  });
});
