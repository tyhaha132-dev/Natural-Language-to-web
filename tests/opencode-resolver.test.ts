import { describe, expect, it } from "vitest";
import { resolveOpenCodeExecutable } from "../src/runtime/opencode-resolver.js";

async function tryResolveOpenCodeExecutable(): Promise<
  string | null
> {
  try {
    return await resolveOpenCodeExecutable();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "Unable to locate opencode.cmd"
      )
    ) {
      console.warn(
        "Skipping OpenCodeResolver test: OpenCode CLI is not installed."
      );

      return null;
    }

    throw error;
  }
}

describe("OpenCodeResolver", () => {
  it("should resolve the real OpenCode executable", async () => {
    const executable =
      await tryResolveOpenCodeExecutable();

    if (executable === null) {
      return;
    }

    expect(executable.toLowerCase()).toContain(
      "opencode.exe"
    );
  });

  it("should resolve an existing executable", async () => {
    const executable =
      await tryResolveOpenCodeExecutable();

    if (executable === null) {
      return;
    }

    expect(executable).toMatch(/opencode\.exe$/i);
  });
});
