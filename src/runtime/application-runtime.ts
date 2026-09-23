import type {
  ApplicationStartCommand,
} from "./application-start-command.js";

export type ApplicationRuntimeType =
  | "STATIC"
  | "NODE";

export interface StaticApplicationRuntime {
  readonly type: "STATIC";
  readonly workspace: string;
}

export interface NodeApplicationRuntime {
  readonly type: "NODE";
  readonly workspace: string;
  readonly startCommand:
    ApplicationStartCommand;
}

export type ApplicationRuntime =
  | StaticApplicationRuntime
  | NodeApplicationRuntime;
