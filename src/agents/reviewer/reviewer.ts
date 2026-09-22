import { MODELS } from "../../config/models.js";
import type { AgentExecutor } from "../agent-executor.js";
import { BaseAgent } from "../base-agent.js";

export class ReviewerAgent extends BaseAgent {
  constructor(
    executor: AgentExecutor
  ) {
    super(
      "reviewer",
      MODELS.reviewer,
      executor
    );
  }
}
