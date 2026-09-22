import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../src/logging/logger.js";

describe("Logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log an INFO message", () => {
    const spy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    logger.info("hello");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T.*Z\] \[INFO\] hello$/
      )
    );
  });

  it("should log a WARN message", () => {
    const spy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    logger.warn("warning");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T.*Z\] \[WARN\] warning$/
      )
    );
  });

  it("should log an ERROR message", () => {
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    logger.error("failure");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T.*Z\] \[ERROR\] failure$/
      )
    );
  });
});
