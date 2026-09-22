import { describe, expect, it, vi } from "vitest";
import {
  createTimeoutManager,
  type TimeoutManager,
} from "../src/runtime/timeout-manager.js";

describe("TimeoutManager", () => {
  it("should expose the expected API", () => {
    const manager: TimeoutManager = createTimeoutManager();

    expect(manager.start).toBeTypeOf("function");
    expect(manager.clear).toBeTypeOf("function");
    expect(manager.hasTimedOut).toBeTypeOf("function");
  });

  it("should not be timed out initially", () => {
    const manager = createTimeoutManager();

    expect(manager.hasTimedOut()).toBe(false);
  });

  it("should report timeout after the configured duration", async () => {
    const manager = createTimeoutManager();

    manager.start(50);

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(manager.hasTimedOut()).toBe(true);

    manager.clear();
  });

  it("should clear the timeout", async () => {
    vi.useFakeTimers();

    const manager = createTimeoutManager();

    manager.start(100);

    manager.clear();

    vi.advanceTimersByTime(200);

    expect(manager.hasTimedOut()).toBe(false);

    vi.useRealTimers();
  });
});