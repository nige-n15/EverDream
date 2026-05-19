/**
 * EverDream Structured Logger
 *
 * Provides consistent, leveled logging with context tags.
 * Logs are stored in localStorage for debugging and can be viewed
 * in the admin dashboard or exported for support.
 *
 * Usage:
 *   import { logger } from './logger';
 *   logger.info('Pipeline', 'Starting transcription...');
 *   logger.error('AI', 'Analysis failed', error);
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

const LOG_STORAGE_KEY = 'ed_app_logs';
const MAX_LOG_ENTRIES = 2000;

function getStoredLogs(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function storeLogs(logs: LogEntry[]): void {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOG_ENTRIES)));
  } catch {
    // Storage full or unavailable
  }
}

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    data: data !== undefined ? data : undefined,
  };

  // Store for later retrieval
  const stored = getStoredLogs();
  stored.push(entry);
  storeLogs(stored);

  // Also output to console with consistent formatting
  const prefix = `[${module}]`;
  const consoleMethod =
    level === 'error' ? console.error :
    level === 'warn' ? console.warn :
    level === 'debug' ? console.debug :
    console.info;

  if (data !== undefined) {
    consoleMethod(prefix, message, data);
  } else {
    consoleMethod(prefix, message);
  }
}

export const logger = {
  debug: (module: string, message: string, data?: unknown) => log('debug', module, message, data),
  info: (module: string, message: string, data?: unknown) => log('info', module, message, data),
  warn: (module: string, message: string, data?: unknown) => log('warn', module, message, data),
  error: (module: string, message: string, data?: unknown) => log('error', module, message, data),

  /** Get all stored logs, optionally filtered by level or module */
  getLogs(filter?: { level?: LogLevel; module?: string; since?: string }): LogEntry[] {
    let logs = getStoredLogs();
    if (filter?.level) {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
      const minIdx = levels.indexOf(filter.level);
      logs = logs.filter(l => levels.indexOf(l.level) >= minIdx);
    }
    if (filter?.module) {
      logs = logs.filter(l => l.module === filter.module);
    }
    if (filter?.since) {
      logs = logs.filter(l => l.timestamp >= filter.since);
    }
    return logs;
  },

  /** Clear all stored logs */
  clearLogs(): void {
    localStorage.removeItem(LOG_STORAGE_KEY);
  },

  /** Export logs as a JSON string for support/debugging */
  exportLogs(): string {
    return JSON.stringify(getStoredLogs(), null, 2);
  },

  /** Get a summary of recent errors */
  getErrorSummary(count = 10): LogEntry[] {
    return getStoredLogs().filter(l => l.level === 'error').slice(-count);
  },
};
