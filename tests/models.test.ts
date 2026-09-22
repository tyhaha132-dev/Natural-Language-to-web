import { describe, expect, it } from "vitest";
import { MODELS } from "../src/config/models.js";

describe("Model configuration", () => {
  it("should define the planner model", () => {
    expect(MODELS.planner).toBe("opencode/nemotron-3-ultra-free");
  });

  it("should define the coder model", () => {
    expect(MODELS.coder).toBe(
      "opencode/muse-spark-1.3-contributor-free"
    );
  });

  it("should define the reviewer model", () => {
    expect(MODELS.reviewer).toBe("opencode/mimo-v2.6-flash-free");
  });
});
