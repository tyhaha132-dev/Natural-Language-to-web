import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPortAllocator,
} from "../src/runtime/port-allocator.js";

describe("PortAllocator", () => {
  it("should allocate a positive TCP port", async () => {
    const allocator =
      createPortAllocator();

    const port =
      await allocator.allocate();

    expect(
      Number.isInteger(port)
    ).toBe(true);

    expect(
      port
    ).toBeGreaterThan(0);

    expect(
      port
    ).toBeLessThanOrEqual(65535);
  });

  it("should allocate ports without returning the same port immediately", async () => {
    const allocator =
      createPortAllocator();

    const firstPort =
      await allocator.allocate();

    const secondPort =
      await allocator.allocate();

    expect(
      firstPort
    ).not.toBe(
      secondPort
    );
  });
});
