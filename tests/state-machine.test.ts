import {
  describe,
  expect,
  it,
} from "vitest";

import {
  canTransition,
  transition,
  getAllowedTransitions,
} from "../src/orchestrator/state-machine.js";

describe("Pipeline state machine", () => {
  it("should allow valid forward transitions", () => {
    expect(
      canTransition(
        "STARTING",
        "ANALYZING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "ANALYZING",
        "ENVIRONMENT_SETUP"
      )
    ).toBe(true);

    expect(
      canTransition(
        "ENVIRONMENT_SETUP",
        "PLANNING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "PLANNING",
        "PLAN_VALIDATING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "PLAN_VALIDATING",
        "CODING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "CODING",
        "DATABASE_SETUP"
      )
    ).toBe(true);

    expect(
      canTransition(
        "DATABASE_SETUP",
        "TESTING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "TESTING",
        "REVIEWING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "REVIEWING",
        "DECIDING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "DECIDING",
        "COMPLETED"
      )
    ).toBe(true);
  });

  it("should allow retry transitions", () => {
    expect(
      canTransition(
        "TESTING",
        "CODING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "REVIEWING",
        "CODING"
      )
    ).toBe(true);

    expect(
      canTransition(
        "DECIDING",
        "CODING"
      )
    ).toBe(true);
  });

  it("should allow failure transitions", () => {
    expect(
      canTransition(
        "STARTING",
        "FAILED"
      )
    ).toBe(true);

    expect(
      canTransition(
        "ANALYZING",
        "FAILED"
      )
    ).toBe(true);

    expect(
      canTransition(
        "ENVIRONMENT_SETUP",
        "FAILED"
      )
    ).toBe(true);

    expect(
      canTransition(
        "PLANNING",
        "FAILED"
      )
    ).toBe(true);

    expect(
      canTransition(
        "PLAN_VALIDATING",
        "FAILED"
      )
    ).toBe(true);
  });

  it("should reject invalid transitions", () => {
    expect(
      canTransition(
        "STARTING",
        "CODING"
      )
    ).toBe(false);

    expect(
      canTransition(
        "ANALYZING",
        "CODING"
      )
    ).toBe(false);

    expect(
      canTransition(
        "COMPLETED",
        "CODING"
      )
    ).toBe(false);
  });

  it("should throw when transition is invalid", () => {
    expect(() =>
      transition(
        "ANALYZING",
        "CODING"
      )
    ).toThrow(
      "Invalid pipeline transition: ANALYZING -> CODING"
    );
  });

  it("should return the new state for a valid transition", () => {
    expect(
      transition(
        "ANALYZING",
        "ENVIRONMENT_SETUP"
      )
    ).toBe(
      "ENVIRONMENT_SETUP"
    );
  });

  it("should expose allowed transitions", () => {
    expect(
      getAllowedTransitions(
        "ANALYZING"
      )
    ).toEqual([
      "ENVIRONMENT_SETUP",
      "FAILED",
    ]);

    expect(
      getAllowedTransitions(
        "ENVIRONMENT_SETUP"
      )
    ).toEqual([
      "PLANNING",
      "FAILED",
    ]);
  });
});
