export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

function createEntry(
  level: LogLevel,
  message: string
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
}

function formatEntry(entry: LogEntry): string {
  return `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
}

export const logger = {
  info(message: string): void {
    console.log(formatEntry(createEntry("INFO", message)));
  },

  warn(message: string): void {
    console.warn(formatEntry(createEntry("WARN", message)));
  },

  error(message: string): void {
    console.error(formatEntry(createEntry("ERROR", message)));
  },
};
