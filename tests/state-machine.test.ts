import { describe, expect, it } from "vitest";
import {
  canTransition,
  getAllowedTransitions,
  transition,
} from "../src/orchestrator/state-machine.js";

describe("Pipeline state machine", () => {
  it("should allow valid forward transitions", () => {
    expect(canTransition("STARTING", "ANALYZING")).toBe(true);
    expect(canTransition("ANALYZING", "PLANNING")).toBe(true);
    expect(canTransition("PLANNING", "PLAN_VALIDATING")).toBe(true);
    expect(canTransition("PLAN_VALIDATING", "ENVIRONMENT_SETUP")).toBe(
      true
    );
    expect(canTransition("ENVIRONMENT_SETUP", "CODING")).toBe(true);
    expect(canTransition("CODING", "DATABASE_SETUP")).toBe(true);
    expect(canTransition("DATABASE_SETUP", "TESTING")).toBe(true);
    expect(canTransition("TESTING", "REVIEWING")).toBe(true);
    expect(canTransition("REVIEWING", "DECIDING")).toBe(true);
    expect(canTransition("DECIDING", "COMPLETED")).toBe(true);
  });

  it("should allow retry transitions", () => {
    expect(canTransition("CODING", "TESTING")).toBe(true);
    expect(canTransition("TESTING", "CODING")).toBe(true);
    expect(canTransition("REVIEWING", "CODING")).toBe(true);
    expect(canTransition("DECIDING", "CODING")).toBe(true);
  });

  it("should allow failure transitions", () => {
    expect(canTransition("STARTING", "FAILED")).toBe(true);
    expect(canTransition("PLANNING", "FAILED")).toBe(true);
    expect(canTransition("CODING", "FAILED")).toBe(true);
    expect(canTransition("TESTING", "FAILED")).toBe(true);
    expect(canTransition("REVIEWING", "FAILED")).toBe(true);
  });

  it("should reject invalid transitions", () => {
    expect(canTransition("STARTING", "CODING")).toBe(false);
    expect(canTransition("PLANNING", "TESTING")).toBe(false);
    expect(canTransition("TESTING", "COMPLETED")).toBe(false);
    expect(canTransition("COMPLETED", "CODING")).toBe(false);
    expect(canTransition("FAILED", "STARTING")).toBe(false);
  });

  it("should throw when transition is invalid", () => {
    expect(() => transition("STARTING", "CODING")).toThrow(
      "Invalid pipeline transition: STARTING -> CODING"
    );
  });

  it("should return the new state for a valid transition", () => {
    expect(transition("STARTING", "ANALYZING")).toBe(
      "ANALYZING"
    );
  });

  it("should expose allowed transitions", () => {
    expect(getAllowedTransitions("STARTING")).toEqual([
      "ANALYZING",
      "FAILED",
    ]);

    expect(getAllowedTransitions("COMPLETED")).toEqual([]);
    expect(getAllowedTransitions("FAILED")).toEqual([]);
  });
});
