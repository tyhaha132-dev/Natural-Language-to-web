export interface TimeoutManager {
  start(timeoutMs: number): void;
  clear(): void;
  hasTimedOut(): boolean;
}

export function createTimeoutManager(): TimeoutManager {
  let timer: NodeJS.Timeout | undefined;
  let timedOut = false;

  return {
    start(timeoutMs: number): void {
      if (timer !== undefined) {
        clearTimeout(timer);
      }

      timedOut = false;

      if (timeoutMs <= 0) {
        return;
      }

      timer = setTimeout(() => {
        timedOut = true;
        timer = undefined;
      }, timeoutMs);
    },

    clear(): void {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }

      timedOut = false;
    },

    hasTimedOut(): boolean {
      return timedOut;
    },
  };
}
