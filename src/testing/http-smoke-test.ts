export interface HttpSmokeTestResult {
  readonly status: "PASSED" | "FAILED";
  readonly url: string;
  readonly statusCode: number | null;
  readonly error: string | null;
}

export interface HttpSmokeTester {
  run(
    baseUrl: string
  ): Promise<HttpSmokeTestResult>;
}

export function createHttpSmokeTester(): HttpSmokeTester {
  return {
    async run(
      baseUrl: string
    ): Promise<HttpSmokeTestResult> {
      try {
        const response =
          await fetch(baseUrl);

        if (!response.ok) {
          return {
            status: "FAILED",
            url: baseUrl,
            statusCode: response.status,
            error:
              `HTTP request returned status ${response.status}`,
          };
        }

        const body =
          await response.text();

        if (body.trim() === "") {
          return {
            status: "FAILED",
            url: baseUrl,
            statusCode: response.status,
            error:
              "HTTP response body is empty",
          };
        }

        return {
          status: "PASSED",
          url: baseUrl,
          statusCode: response.status,
          error: null,
        };
      } catch (error) {
        return {
          status: "FAILED",
          url: baseUrl,
          statusCode: null,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        };
      }
    },
  };
}
