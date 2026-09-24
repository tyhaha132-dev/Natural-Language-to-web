import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createHttpSmokeTester,
} from "../src/testing/http-smoke-test.js";

describe(
  "HttpSmokeTester",
  () => {
    it(
      "passes when the application returns HTTP 200 with content",
      async () => {
        const originalFetch =
          globalThis.fetch;

        globalThis.fetch =
          async () =>
            new Response(
              "<html><body>Hello</body></html>",
              {
                status: 200,
              }
            );

        try {
          const tester =
            createHttpSmokeTester();

          const result =
            await tester.run(
              "http://127.0.0.1:43140"
            );

          expect(
            result.status
          ).toBe("PASSED");

          expect(
            result.statusCode
          ).toBe(200);

          expect(
            result.error
          ).toBeNull();
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      }
    );

    it(
      "fails when the application returns a non-success status",
      async () => {
        const originalFetch =
          globalThis.fetch;

        globalThis.fetch =
          async () =>
            new Response(
              "Not Found",
              {
                status: 404,
              }
            );

        try {
          const tester =
            createHttpSmokeTester();

          const result =
            await tester.run(
              "http://127.0.0.1:43140"
            );

          expect(
            result.status
          ).toBe("FAILED");

          expect(
            result.statusCode
          ).toBe(404);

          expect(
            result.error
          ).toContain("404");
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      }
    );

    it(
      "fails when the response body is empty",
      async () => {
        const originalFetch =
          globalThis.fetch;

        globalThis.fetch =
          async () =>
            new Response(
              "",
              {
                status: 200,
              }
            );

        try {
          const tester =
            createHttpSmokeTester();

          const result =
            await tester.run(
              "http://127.0.0.1:43140"
            );

          expect(
            result.status
          ).toBe("FAILED");

          expect(
            result.statusCode
          ).toBe(200);

          expect(
            result.error
          ).toBe(
            "HTTP response body is empty"
          );
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      }
    );

    it(
      "fails when the HTTP request throws",
      async () => {
        const originalFetch =
          globalThis.fetch;

        globalThis.fetch =
          async () => {
            throw new Error(
              "Connection refused"
            );
          };

        try {
          const tester =
            createHttpSmokeTester();

          const result =
            await tester.run(
              "http://127.0.0.1:43140"
            );

          expect(
            result.status
          ).toBe("FAILED");

          expect(
            result.statusCode
          ).toBeNull();

          expect(
            result.error
          ).toBe(
            "Connection refused"
          );
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      }
    );
  }
);
