import { describe, expect, it } from "vitest";
import { getSystemName } from "../src/index.js";

describe("Project Bootstrap", () => {
  it("should expose the correct system name", () => {
    expect(getSystemName()).toBe("web-coding-agent");
  });
});
