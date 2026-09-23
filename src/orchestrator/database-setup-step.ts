import type {
  DatabaseManager,
} from "../infrastructure/database/database-manager.js";

import type {
  DatabaseResult,
} from "./database-result.js";

import type {
  PipelineExecutionContext,
} from "./pipeline-execution-context.js";

import type {
  PipelineStep,
} from "./pipeline-step.js";

export class DatabaseSetupStep
  implements PipelineStep
{
  readonly name = "setup-database";

  private readonly databaseManager:
    DatabaseManager;

  constructor(
    databaseManager: DatabaseManager
  ) {
    this.databaseManager =
      databaseManager;
  }

  async execute(
    context: PipelineExecutionContext
  ): Promise<PipelineExecutionContext> {
    await this.databaseManager.connect();

    const health =
      await this.databaseManager.health();

    if (!health.available) {
      throw new Error(
        health.error ??
        "Database is unavailable"
      );
    }

    const databaseResult:
      DatabaseResult = {
      available:
        health.available,
      host:
        health.host,
      port:
        health.port,
      database:
        health.database,
      user:
        health.user,
      durationMs:
        health.durationMs,
    };

    return {
      ...context,
      databaseResult,
      updatedAt:
        new Date().toISOString(),
    };
  }
}
