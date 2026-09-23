export interface TestCommand {
  command: string;
  args: readonly string[];
}

export interface TestPlan {
  commands: readonly TestCommand[];
}
