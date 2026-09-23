import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPlanValidator,
} from "../src/planner/plan-validator.js";

describe("PlanValidator", () => {
  const validator =
    createPlanValidator();

  it("should accept a valid plan", () => {
    const result =
      validator.validate({
        prompt: "Create a student management web app",
        plan: "Build frontend, backend, database and tests",
        plannedAt: new Date().toISOString(),
      });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should reject an empty prompt", () => {
    const result =
      validator.validate({
        prompt: "",
        plan: "Some plan",
        plannedAt: new Date().toISOString(),
      });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Plan prompt cannot be empty"
    );
  });

  it("should reject an empty plan", () => {
    const result =
      validator.validate({
        prompt: "Create a web app",
        plan: "",
        plannedAt: new Date().toISOString(),
      });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Plan content cannot be empty"
    );
  });

  it("should reject an empty timestamp", () => {
    const result =
      validator.validate({
        prompt: "Create a web app",
        plan: "Build the application",
        plannedAt: "",
      });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Plan timestamp cannot be empty"
    );
  });
});
