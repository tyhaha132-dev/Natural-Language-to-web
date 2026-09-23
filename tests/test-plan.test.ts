import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  TestPlan,
} from "../src/testing/test-plan.js";

describe("TestPlan", () => {
  it("should describe a sequence of test commands", () => {
    const plan: TestPlan = {
      commands: [
        {
          command: "npm.cmd",
          args: [
            "run",
            "typecheck",
          ],
        },
        {
          command: "npm.cmd",
          args: ["test"],
        },
      ],
    };

    expect(
      plan.commands
    ).toHaveLength(2);

    expect(
      plan.commands[0]
    ).toEqual({
      command: "npm.cmd",
      args: [
        "run",
        "typecheck",
      ],
    });
  });
});
