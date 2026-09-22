import { MODELS } from "../../config/models.js";
import type { AgentExecutor } from "../agent-executor.js";
import { BaseAgent } from "../base-agent.js";

export class CoderAgent extends BaseAgent {
  constructor(
    executor: AgentExecutor
  ) {
    super(
      "coder",
      MODELS.coder,
      executor
    );
  }
}
