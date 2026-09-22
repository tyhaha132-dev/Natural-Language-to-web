import { describe, expect, it } from "vitest";
import { resolveOpenCodeExecutable } from "../src/runtime/opencode-resolver.js";

describe("OpenCodeResolver", () => {
  it("should resolve the real OpenCode executable", async () => {
    const executable = await resolveOpenCodeExecutable();

    expect(executable.toLowerCase()).toContain(
      "opencode.exe"
    );
  });

  it("should resolve an existing executable", async () => {
    const executable = await resolveOpenCodeExecutable();

    expect(executable).toMatch(/opencode\.exe$/i);
  });
});
