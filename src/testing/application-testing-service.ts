import type {
  ApplicationServer,
} from "../runtime/application-server.js";

import type {
  ApplicationServerResolver,
} from "../runtime/application-server-resolver.js";

import type {
  ApplicationTestRunner,
} from "./application-test-runner.js";

import type {
  HttpSmokeTester,
} from "./http-smoke-test.js";

import type {
  TestCommand,
} from "./test-plan.js";

export type ApplicationTestingStatus =
  | "PASSED"
  | "FAILED";

export interface ApplicationTestingResult {
  readonly status:
    ApplicationTestingStatus;

  readonly runtime:
    "STATIC" | "NODE";

  readonly applicationStarted:
    boolean;

  readonly url: string;

  readonly error:
    string | null;
}

export interface ApplicationTestingService {
  run(
    workspace: string,
    commands: readonly TestCommand[]
  ): Promise<ApplicationTestingResult>;
}

export interface ApplicationTestingServiceOptions {
  readonly applicationServerResolver:
    ApplicationServerResolver;

  readonly applicationTestRunner:
    ApplicationTestRunner;

  readonly httpSmokeTester:
    HttpSmokeTester;
}

export function createApplicationTestingService(
  options: ApplicationTestingServiceOptions
): ApplicationTestingService {
  return {
    async run(
      workspace,
      _commands
    ): Promise<ApplicationTestingResult> {
      console.log(
        "[APP_SERVICE_DEBUG] run started"
      );

      console.log(
        `[APP_SERVICE_DEBUG] workspace: ${workspace}`
      );

      console.log(
        "[APP_SERVICE_DEBUG] resolving application server"
      );

      const server:
        ApplicationServer =
        await options.applicationServerResolver.resolve(
          workspace
        );

      console.log(
        "[APP_SERVICE_DEBUG] server resolved"
      );

      console.log(
        `[APP_SERVICE_DEBUG] runtime: ${server.runtime.type}`
      );

      console.log(
        `[APP_SERVICE_DEBUG] baseUrl: ${server.baseUrl}`
      );

      let applicationStarted =
        false;

      try {
        console.log(
          "[APP_SERVICE_DEBUG] starting application"
        );

        await server.start();

        applicationStarted = true;

        console.log(
          `[APP_SERVICE_DEBUG] application started: ${server.baseUrl}`
        );

        console.log(
          "[APP_SERVICE_DEBUG] running HTTP smoke test"
        );

        const smokeResult =
          await options.httpSmokeTester.run(
            server.baseUrl
          );

        console.log(
          `[APP_SERVICE_DEBUG] HTTP smoke status: ${smokeResult.status}`
        );

        if (
          smokeResult.status !==
          "PASSED"
        ) {
          console.log(
            "[APP_SERVICE_DEBUG] HTTP smoke failed"
          );

          return {
            status: "FAILED",

            runtime:
              server.runtime.type,

            applicationStarted,

            url:
              server.baseUrl,

            error:
              smokeResult.error ??
              `HTTP smoke test failed with status ${smokeResult.statusCode}`,
          };
        }

        console.log(
          "[APP_SERVICE_DEBUG] HTTP smoke passed"
        );

        return {
          status: "PASSED",

          runtime:
            server.runtime.type,

          applicationStarted,

          url:
            server.baseUrl,

          error: null,
        };
      } catch (error) {
        console.log(
          "[APP_SERVICE_DEBUG] application test failed"
        );

        return {
          status: "FAILED",

          runtime:
            server.runtime.type,

          applicationStarted,

          url:
            server.baseUrl,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        };
      } finally {
        if (applicationStarted) {
          console.log(
            "[APP_SERVICE_DEBUG] stopping application"
          );

          await server.stop();

          console.log(
            "[APP_SERVICE_DEBUG] application stopped"
          );
        }
      }
    },
  };
}
