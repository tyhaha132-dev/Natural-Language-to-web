import { logger } from "./logger.js";

export type PipelineEvent =
  | "PIPELINE_START"
  | "STATE_CHANGE"
  | "AGENT_START"
  | "AGENT_COMPLETE"
  | "TEST_START"
  | "TEST_PASS"
  | "TEST_FAIL"
  | "PIPELINE_COMPLETE";

export const pipelineLogger = {
  event(
    event: PipelineEvent,
    message: string
  ): void {
    logger.info(`[${event}] ${message}`);
  },

  start(pipelineId: string): void {
    this.event(
      "PIPELINE_START",
      `Pipeline ${pipelineId} started`
    );
  },

  stateChange(
    pipelineId: string,
    from: string,
    to: string
  ): void {
    this.event(
      "STATE_CHANGE",
      `Pipeline ${pipelineId}: ${from} -> ${to}`
    );
  },

  agentStart(
    pipelineId: string,
    agent: string
  ): void {
    this.event(
      "AGENT_START",
      `Pipeline ${pipelineId}: ${agent} started`
    );
  },

  agentComplete(
    pipelineId: string,
    agent: string
  ): void {
    this.event(
      "AGENT_COMPLETE",
      `Pipeline ${pipelineId}: ${agent} completed`
    );
  },

  testStart(pipelineId: string): void {
    this.event(
      "TEST_START",
      `Pipeline ${pipelineId}: tests started`
    );
  },

  testPass(pipelineId: string): void {
    this.event(
      "TEST_PASS",
      `Pipeline ${pipelineId}: tests passed`
    );
  },

  testFail(
    pipelineId: string,
    reason: string
  ): void {
    this.event(
      "TEST_FAIL",
      `Pipeline ${pipelineId}: tests failed - ${reason}`
    );
  },

  complete(pipelineId: string): void {
    this.event(
      "PIPELINE_COMPLETE",
      `Pipeline ${pipelineId} completed`
    );
  },
};
