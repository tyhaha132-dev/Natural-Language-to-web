import type {
  ApplicationRuntime,
} from "./application-runtime.js";

export interface ApplicationServer {
  readonly runtime:
    ApplicationRuntime;

  readonly baseUrl: string;

  start(): Promise<void>;

  stop(): Promise<void>;

  isRunning(): boolean;
}
