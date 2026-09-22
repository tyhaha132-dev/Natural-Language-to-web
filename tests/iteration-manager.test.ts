import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createIterationManager,
} from "../src/orchestrator/iteration-manager.js";

describe("IterationManager", () => {
  it("should start at iteration zero", () => {
    const manager =
      createIterationManager({
        maxIterations: 5,
      });

    expect(manager.getCurrent()).toBe(0);
    expect(manager.canContinue()).toBe(true);
  });

  it("should increment iterations", () => {
    const manager =
      createIterationManager({
        maxIterations: 3,
      });

    expect(manager.next()).toBe(1);
    expect(manager.next()).toBe(2);
    expect(manager.next()).toBe(3);
    expect(manager.getCurrent()).toBe(3);
    expect(manager.canContinue()).toBe(false);
  });

  it("should reject next when maximum is reached", () => {
    const manager =
      createIterationManager({
        maxIterations: 2,
      });

    manager.next();
    manager.next();

    expect(() => manager.next()).toThrow(
      "Maximum iterations reached: 2"
    );
  });

  it("should reject assertCanContinue at the limit", () => {
    const manager =
      createIterationManager({
        maxIterations: 1,
      });

    manager.assertCanContinue();
    manager.next();

    expect(() =>
      manager.assertCanContinue()
    ).toThrow(
      "Maximum iterations reached: 1"
    );
  });

  it("should reject invalid maximum iterations", () => {
    expect(() =>
      createIterationManager({
        maxIterations: 0,
      })
    ).toThrow(
      "maxIterations must be a positive integer"
    );

    expect(() =>
      createIterationManager({
        maxIterations: -1,
      })
    ).toThrow(
      "maxIterations must be a positive integer"
    );
  });
});
