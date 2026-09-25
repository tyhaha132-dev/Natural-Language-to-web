import { promises as fs } from "node:fs";

import path from "node:path";

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

import type {
  TestRunner,
} from "./test-runner.js";

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

  readonly testRunner?: TestRunner;
}

async function hasScript(
  workspace: string,
  scriptName: string
): Promise<boolean> {
  try {
    const raw =
      await fs.readFile(
        path.join(
          workspace,
          "package.json"
        ),
        "utf8"
      );

    const parsed: unknown =
      JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return false;
    }

    const scripts = (
      parsed as {
        scripts?: unknown;
      }
    ).scripts;

    if (
      typeof scripts !== "object" ||
      scripts === null
    ) {
      return false;
    }

    const script = (
      scripts as Record<
        string,
        unknown
      >
    )[scriptName];

    return (
      typeof script === "string" &&
      script.trim().length > 0
    );
  } catch {
    return false;
  }
}

async function hasTestScript(
  workspace: string
): Promise<boolean> {
  return hasScript(
    workspace,
    "test"
  );
}

function tail(
  text: string,
  maxChars: number
): string {
  if (text.length <= maxChars) {
    return text;
  }

  return (
    "...[truncated]...\n" +
    text.slice(-maxChars)
  );
}

export function createApplicationTestingService(
  options: ApplicationTestingServiceOptions
): ApplicationTestingService {
  /*
   * Production build gate.
   *
   * A previous run shipped a stale/broken build: smoke passed
   * against old output while the current sources had never been
   * built. Apps declaring a build script are rebuilt here so the
   * server under test always matches the workspace sources.
   */
  async function runBuildIfDeclared(
    workspace: string
  ): Promise<string | null> {
    if (
      options.testRunner ===
        undefined
    ) {
      return null;
    }

    if (
      !(await hasScript(
        workspace,
        "build"
      ))
    ) {
      console.log(
        "[APP_SERVICE_DEBUG] no build script in workspace, skipping build"
      );

      return null;
    }

    const buildCommand: TestCommand = {
      command:
        process.platform ===
        "win32"
          ? "npm.cmd"
          : "npm",
      args: ["run", "build"],
    };

    console.log(
      "[APP_SERVICE_DEBUG] running application build before start"
    );

    const processResult =
      await options.testRunner.run(
        workspace,
        buildCommand
      );

    if (
      processResult.timedOut ||
      processResult.exitCode !== 0
    ) {
      const output = tail(
        [
          processResult.stderr,
          processResult.stdout,
        ]
          .filter(
            (part) =>
              part.trim().length > 0
          )
          .join("\n") ||
          `exit code ${processResult.exitCode}`,
        3000
      );

      return [
        "Application build failed: npm run build",
        `Exit code: ${processResult.timedOut ? "timed out" : processResult.exitCode}`,
        `Output:\n${output}`,
      ].join("\n");
    }

    console.log(
      "[APP_SERVICE_DEBUG] application build passed"
    );

    return null;
  }

  async function runGeneratedTests(
    workspace: string,
    commands: readonly TestCommand[]
  ): Promise<string | null> {
    if (
      options.testRunner ===
        undefined ||
      commands.length === 0
    ) {
      return null;
    }

    if (
      !(await hasTestScript(
        workspace
      ))
    ) {
      console.log(
        "[APP_SERVICE_DEBUG] no test script in workspace, skipping generated tests"
      );

      return null;
    }

    for (const command of commands) {
      console.log(
        `[APP_SERVICE_DEBUG] running generated test command: ${command.command} ${command.args.join(" ")}`
      );

      const processResult =
        await options.testRunner.run(
          workspace,
          command
        );

      if (
        processResult.timedOut ||
        processResult.exitCode !==
          0
      ) {
        const output = tail(
          [
            processResult.stderr,
            processResult.stdout,
          ]
            .filter(
              (part) =>
                part.trim().length >
                0
            )
            .join("\n") ||
            `exit code ${processResult.exitCode}`,
          3000
        );

        return [
          `Generated test command failed: ${command.command} ${command.args.join(" ")}`,
          `Exit code: ${processResult.timedOut ? "timed out" : processResult.exitCode}`,
          `Output:\n${output}`,
        ].join("\n");
      }
    }

    console.log(
      "[APP_SERVICE_DEBUG] generated tests passed"
    );

    return null;
  }

  return {
    async run(
      workspace,
      commands
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
        const buildError =
          await runBuildIfDeclared(
            workspace
          );

        if (
          buildError !== null
        ) {
          console.log(
            "[APP_SERVICE_DEBUG] application build failed"
          );

          return {
            status: "FAILED",

            runtime:
              server.runtime.type,

            applicationStarted,

            url:
              server.baseUrl,

            error:
              buildError,
          };
        }

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

        const generatedTestError =
          await runGeneratedTests(
            workspace,
            commands
          );

        if (
          generatedTestError !==
          null
        ) {
          console.log(
            "[APP_SERVICE_DEBUG] generated tests failed"
          );

          return {
            status: "FAILED",

            runtime:
              server.runtime.type,

            applicationStarted,

            url:
              server.baseUrl,

            error:
              generatedTestError,
          };
        }

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
