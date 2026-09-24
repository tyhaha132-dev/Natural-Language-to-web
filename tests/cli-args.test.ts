import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseAgentCliArgs,
} from "../src/index.js";

describe("parseAgentCliArgs", () => {
  it("should parse id and prompt", () => {
    expect(
      parseAgentCliArgs([
        "--id",
        "my-app",
        "--prompt",
        "Build a landing page",
      ])
    ).toEqual({
      id: "my-app",
      prompt:
        "Build a landing page",
    });
  });

  it("should accept equals syntax and a port", () => {
    expect(
      parseAgentCliArgs([
        "--id=my-app",
        "--prompt=Build it",
        "--port=43210",
      ])
    ).toEqual({
      id: "my-app",
      prompt: "Build it",
      port: 43210,
    });
  });

  it("should reject a missing id", () => {
    expect(() =>
      parseAgentCliArgs([
        "--prompt",
        "Build it",
      ])
    ).toThrow(/--id/);
  });

  it("should reject a missing prompt", () => {
    expect(() =>
      parseAgentCliArgs([
        "--id",
        "my-app",
      ])
    ).toThrow(/--prompt/);
  });

  it("should reject unsafe pipeline ids", () => {
    for (const bad of [
      "../evil",
      "a/b",
      "a\\b",
      "..",
      "has space",
    ]) {
      expect(() =>
        parseAgentCliArgs([
          "--id",
          bad,
          "--prompt",
          "Build it",
        ])
      ).toThrow(/Invalid pipeline id/);
    }
  });

  it("should reject an invalid port", () => {
    expect(() =>
      parseAgentCliArgs([
        "--id",
        "my-app",
        "--prompt",
        "Build it",
        "--port=abc",
      ])
    ).toThrow(/Invalid port/);
  });
});
