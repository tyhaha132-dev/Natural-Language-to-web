import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  promises as fs,
} from "node:fs";

import os from "node:os";

import path from "node:path";

import {
  createApplicationTestingService,
} from "../src/testing/application-testing-service.js";

import type {
  ApplicationServer,
} from "../src/runtime/application-server.js";

import type {
  ApplicationServerResolver,
} from "../src/runtime/application-server-resolver.js";

import type {
  ApplicationTestRunner,
} from "../src/testing/application-test-runner.js";

import type {
  HttpSmokeTester,
} from "../src/testing/http-smoke-test.js";

import type {
  TestRunner,
} from "../src/testing/test-runner.js";

const testCommands = [
  {
    command: "npm.cmd",
    args: ["test"],
  },
];

function createStaticServer(): ApplicationServer {
  return {
    runtime: {
      type: "STATIC",
      workspace: "C:\\workspace\\app",
    },
    baseUrl: "http://127.0.0.1:43127",
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    isRunning: vi.fn().mockReturnValue(true),
  };
}

function createNodeServer(): ApplicationServer {
  return {
    runtime: {
      type: "NODE",
      workspace: "C:\\workspace\\app",
      startCommand: {
        command: "npm.cmd",
        args: ["run", "dev"],
      },
    },
    baseUrl: "http://127.0.0.1:43128",
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    isRunning: vi.fn().mockReturnValue(true),
  };
}

function createService(
  server: ApplicationServer,
  httpSmokeTester: HttpSmokeTester,
  testRunner?: TestRunner
): {
  service: ReturnType<
    typeof createApplicationTestingService
  >;
  applicationServerResolver: ApplicationServerResolver;
  applicationTestRunner: ApplicationTestRunner;
} {
  const applicationServerResolver:
    ApplicationServerResolver = {
    resolve:
      vi.fn().mockResolvedValue(
        server
      ),
  };

  const applicationTestRunner:
    ApplicationTestRunner = {
    run: vi.fn(),
  };

  const service =
    createApplicationTestingService({
      applicationServerResolver,
      applicationTestRunner,
      httpSmokeTester,
      ...(testRunner === undefined
        ? {}
        : { testRunner }),
    });

  return {
    service,
    applicationServerResolver,
    applicationTestRunner,
  };
}

async function createWorkspaceWithPackage(
  scripts: Record<string, string>
): Promise<string> {
  const workspace =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "app-testing-"
      )
    );

  await fs.writeFile(
    path.join(
      workspace,
      "package.json"
    ),
    JSON.stringify({
      name: "generated-app",
      scripts,
    })
  );

  return workspace;
}

function createPassingSmoke(
  url: string
): HttpSmokeTester {
  return {
    run:
      vi.fn().mockResolvedValue({
        status: "PASSED",
        url,
        statusCode: 200,
        error: null,
      }),
  };
}

describe("ApplicationTestingService", () => {
  it("should start a static application, run HTTP smoke test, and stop it", async () => {
    const server =
      createStaticServer();

    const httpSmokeTester:
      HttpSmokeTester = {
      run:
        vi.fn().mockResolvedValue({
          status: "PASSED",
          url:
            "http://127.0.0.1:43127",
          statusCode: 200,
          error: null,
        }),
    };

    const {
      service,
      applicationServerResolver,
      applicationTestRunner,
    } =
      createService(
        server,
        httpSmokeTester
      );

    const result =
      await service.run(
        "C:\\workspace\\app",
        testCommands
      );

    expect(
      applicationServerResolver.resolve
    ).toHaveBeenCalledWith(
      "C:\\workspace\\app"
    );

    expect(
      server.start
    ).toHaveBeenCalledTimes(1);

    expect(
      httpSmokeTester.run
    ).toHaveBeenCalledWith(
      "http://127.0.0.1:43127"
    );

    expect(
      server.stop
    ).toHaveBeenCalledTimes(1);

    expect(
      applicationTestRunner.run
    ).not.toHaveBeenCalled();

    expect(
      result
    ).toEqual({
      status: "PASSED",
      runtime: "STATIC",
      applicationStarted: true,
      url:
        "http://127.0.0.1:43127",
      error: null,
    });
  });

  it("should return FAILED when static HTTP smoke test fails", async () => {
    const server =
      createStaticServer();

    const httpSmokeTester:
      HttpSmokeTester = {
      run:
        vi.fn().mockResolvedValue({
          status: "FAILED",
          url:
            "http://127.0.0.1:43127",
          statusCode: 500,
          error:
            "HTTP request returned status 500",
        }),
    };

    const {
      service,
      applicationTestRunner,
    } =
      createService(
        server,
        httpSmokeTester
      );

    const result =
      await service.run(
        "C:\\workspace\\app",
        testCommands
      );

    expect(
      result.status
    ).toBe("FAILED");

    expect(
      result.error
    ).toBe(
      "HTTP request returned status 500"
    );

    expect(
      server.stop
    ).toHaveBeenCalledTimes(1);

    expect(
      applicationTestRunner.run
    ).not.toHaveBeenCalled();
  });

  it("should start a NODE application and run HTTP smoke test", async () => {
    const server =
      createNodeServer();

    const httpSmokeTester:
      HttpSmokeTester = {
      run:
        vi.fn().mockResolvedValue({
          status: "PASSED",
          url:
            "http://127.0.0.1:43128",
          statusCode: 200,
          error: null,
        }),
    };

    const {
      service,
      applicationTestRunner,
    } =
      createService(
        server,
        httpSmokeTester
      );

    const result =
      await service.run(
        "C:\\workspace\\app",
        testCommands
      );

    expect(
      server.start
    ).toHaveBeenCalledTimes(1);

    expect(
      httpSmokeTester.run
    ).toHaveBeenCalledWith(
      "http://127.0.0.1:43128"
    );

    expect(
      applicationTestRunner.run
    ).not.toHaveBeenCalled();

    expect(
      server.stop
    ).toHaveBeenCalledTimes(1);

    expect(
      result
    ).toEqual({
      status: "PASSED",
      runtime: "NODE",
      applicationStarted: true,
      url:
        "http://127.0.0.1:43128",
      error: null,
    });
  });

  it("should report NODE HTTP smoke failure", async () => {
    const server =
      createNodeServer();

    const httpSmokeTester:
      HttpSmokeTester = {
      run:
        vi.fn().mockResolvedValue({
          status: "FAILED",
          url:
            "http://127.0.0.1:43128",
          statusCode: 500,
          error:
            "HTTP request returned status 500",
        }),
    };

    const {
      service,
      applicationTestRunner,
    } =
      createService(
        server,
        httpSmokeTester
      );

    const result =
      await service.run(
        "C:\\workspace\\app",
        testCommands
      );

    expect(
      result.status
    ).toBe("FAILED");

    expect(
      result.runtime
    ).toBe("NODE");

    expect(
      result.applicationStarted
    ).toBe(true);

    expect(
      result.url
    ).toBe(
      "http://127.0.0.1:43128"
    );

    expect(
      result.error
    ).toBe(
      "HTTP request returned status 500"
    );

    expect(
      applicationTestRunner.run
    ).not.toHaveBeenCalled();

    expect(
      server.stop
    ).toHaveBeenCalledTimes(1);
  });

  it("should report server startup failure", async () => {
    const server =
      createStaticServer();

    server.start =
      vi.fn().mockRejectedValue(
        new Error(
          "server failed to start"
        )
      );

    const httpSmokeTester:
      HttpSmokeTester = {
      run: vi.fn(),
    };

    const {
      service,
      applicationTestRunner,
    } =
      createService(
        server,
        httpSmokeTester
      );

    const result =
      await service.run(
        "C:\\workspace\\app",
        testCommands
      );

    expect(
      result.status
    ).toBe("FAILED");

    expect(
      result.applicationStarted
    ).toBe(false);

    expect(
      result.error
    ).toBe(
      "server failed to start"
    );

    expect(
      server.stop
    ).not.toHaveBeenCalled();

    expect(
      httpSmokeTester.run
    ).not.toHaveBeenCalled();

    expect(
      applicationTestRunner.run
    ).not.toHaveBeenCalled();
  });

  it("should run generated tests when the workspace has a test script", async () => {
    const workspace =
      await createWorkspaceWithPackage({
        test: "node --test",
      });

    const server =
      createStaticServer();

    const testRunner: TestRunner = {
      run: vi.fn().mockResolvedValue({
        command: "npm.cmd",
        args: ["test"],
        exitCode: 0,
        stdout: "tests passed",
        stderr: "",
        timedOut: false,
        durationMs: 5,
      }),
    };

    const { service } =
      createService(
        server,
        createPassingSmoke(
          "http://127.0.0.1:43127"
        ),
        testRunner
      );

    const result =
      await service.run(
        workspace,
        testCommands
      );

    expect(
      testRunner.run
    ).toHaveBeenCalledWith(
      workspace,
      testCommands[0]
    );

    expect(
      result.status
    ).toBe("PASSED");

    expect(
      result.error
    ).toBeNull();

    await fs.rm(
      workspace,
      {
        recursive: true,
        force: true,
      }
    );
  });

  it("should fail when generated tests fail", async () => {
    const workspace =
      await createWorkspaceWithPackage({
        test: "node --test",
      });

    const server =
      createStaticServer();

    const testRunner: TestRunner = {
      run: vi.fn().mockResolvedValue({
        command: "npm.cmd",
        args: ["test"],
        exitCode: 1,
        stdout: "",
        stderr:
          "AssertionError: missing email validation",
        timedOut: false,
        durationMs: 5,
      }),
    };

    const { service } =
      createService(
        server,
        createPassingSmoke(
          "http://127.0.0.1:43127"
        ),
        testRunner
      );

    const result =
      await service.run(
        workspace,
        testCommands
      );

    expect(
      result.status
    ).toBe("FAILED");

    expect(
      result.error
    ).toContain("npm.cmd");

    expect(
      result.error
    ).toContain(
      "missing email validation"
    );

    await fs.rm(
      workspace,
      {
        recursive: true,
        force: true,
      }
    );
  });

  it("should skip generated tests when the workspace has no test script", async () => {
    const workspace =
      await createWorkspaceWithPackage({
        start: "node server.js",
      });

    const server =
      createStaticServer();

    const testRunner: TestRunner = {
      run: vi.fn(),
    };

    const { service } =
      createService(
        server,
        createPassingSmoke(
          "http://127.0.0.1:43127"
        ),
        testRunner
      );

    const result =
      await service.run(
        workspace,
        testCommands
      );

    expect(
      testRunner.run
    ).not.toHaveBeenCalled();

    expect(
      result.status
    ).toBe("PASSED");

    await fs.rm(
      workspace,
      {
        recursive: true,
        force: true,
      }
    );
  });
});
