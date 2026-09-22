import type { ProcessResult } from "../runtime/process-result.js";
import { runProcess } from "../runtime/process-runner.js";

export interface GitManager {
  status(): Promise<ProcessResult>;
  diff(): Promise<ProcessResult>;
  stage(paths: readonly string[]): Promise<ProcessResult>;
  checkpoint(message: string): Promise<ProcessResult>;
}

export function createGitManager(
  workspace: string
): GitManager {
  const runGit = (
    args: readonly string[]
  ): Promise<ProcessResult> => {
    return runProcess(
      "git",
      args,
      {
        cwd: workspace,
      }
    );
  };

  return {
    status(): Promise<ProcessResult> {
      return runGit([
        "status",
        "--short",
      ]);
    },

    diff(): Promise<ProcessResult> {
      return runGit([
        "diff",
      ]);
    },

    stage(
      paths: readonly string[]
    ): Promise<ProcessResult> {
      if (paths.length === 0) {
        return Promise.reject(
          new Error(
            "Git stage requires at least one path"
          )
        );
      }

      return runGit([
        "add",
        "--",
        ...paths,
      ]);
    },

    async checkpoint(
      message: string
    ): Promise<ProcessResult> {
      if (message.trim() === "") {
        throw new Error(
          "Git checkpoint message must not be empty"
        );
      }

      return runGit([
        "commit",
        "-m",
        message,
      ]);
    },
  };
}
