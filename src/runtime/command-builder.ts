export interface CommandSpec {
  command: string;
  args: readonly string[];
}

export function buildCommand(
  command: string,
  args: readonly string[] = []
): CommandSpec {
  return {
    command,
    args: [...args],
  };
}
