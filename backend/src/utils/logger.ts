export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

function log(level: LogLevel, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  if (meta !== undefined) {
    console.log(`[${timestamp}] [${level}] ${message}`, meta);
  } else {
    console.log(`[${timestamp}] [${level}] ${message}`);
  }
}

export const logger = {
  info(message: string, meta?: unknown): void {
    log(LogLevel.INFO, message, meta);
  },
  warn(message: string, meta?: unknown): void {
    log(LogLevel.WARN, message, meta);
  },
  error(message: string, meta?: unknown): void {
    log(LogLevel.ERROR, message, meta);
  },
};
