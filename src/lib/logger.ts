type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
}

export const logger = {
  info: (message: string, context?: any) => log('info', message, context),
  warn: (message: string, context?: any) => log('warn', message, context),
  error: (message: string, context?: any) => log('error', message, context),
  debug: (message: string, context?: any) => log('debug', message, context),
};

function log(level: LogLevel, message: string, context?: any) {
  if (process.env.NODE_ENV === 'production') {
    // In production: Send to monitoring service (e.g., Sentry, LogRocket)
    // For now: Structured JSON logs
    console.log(JSON.stringify({ level, message, context, timestamp: new Date().toISOString() }));
  } else {
    // Development: Pretty print
    console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}]`, message, context || '');
  }
}
