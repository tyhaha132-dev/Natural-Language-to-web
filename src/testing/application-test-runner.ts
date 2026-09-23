import type {
  ApplicationServer,
} from "../runtime/application-server.js";

import type {
  TestResult,
} from "./test-result.js";

export interface ApplicationTestRunnerResult {
  readonly status:
    | "PASSED"
    | "FAILED";

  readonly results:
    readonly TestResult[];

  readonly applicationStarted:
    boolean;
}

export interface ApplicationTestRunner {
  run(
    server: ApplicationServer,
    workspace: string,
    commands: readonly {
      command: string;
      args: readonly string[];
    }[]
  ): Promise<ApplicationTestRunnerResult>;
}
