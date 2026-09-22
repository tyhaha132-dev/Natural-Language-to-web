import { describe, expect, it } from "vitest";
import {
  buildCommand,
  type CommandSpec,
} from "../src/runtime/command-builder.js";

describe("CommandBuilder", () => {
  it("should expose the expected command specification", () => {
    const command: CommandSpec = buildCommand(
      "node",
      ["--version"]
    );

    expect(command.command).toBe("node");
    expect(command.args).toEqual(["--version"]);
  });

  it("should build a command without arguments", () => {
    const command = buildCommand("node");

    expect(command.command).toBe("node");
    expect(command.args).toEqual([]);
  });

  it("should preserve argument order", () => {
    const command = buildCommand(
      "npm.cmd",
      ["run", "build", "--", "--mode", "production"]
    );

    expect(command.command).toBe("npm.cmd");
    expect(command.args).toEqual([
      "run",
      "build",
      "--",
      "--mode",
      "production",
    ]);
  });

  it("should not mutate the original arguments", () => {
    const args = ["--version"];

    const command = buildCommand("node", args);

    expect(command.args).toEqual(args);
    expect(command.args).not.toBe(args);
  });
});