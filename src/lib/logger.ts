type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// ─── Delivery event status ─────────────────────────────────────────────────────
export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'rate_limited' | 'mock';

export interface EmailDeliveryEvent {
  provider: 'nodemailer' | 'brevo' | 'ethereal' | 'smtp' | 'mock';
  to: string;          // will be masked in logs
  subject: string;
  messageId?: string;
  status: DeliveryStatus;
  errorCode?: string | number;
  errorMessage?: string;
  attemptNumber?: number;
  durationMs?: number;
}

// ─── PII masking helpers ───────────────────────────────────────────────────────

/** Masks email: john@example.com → j***@example.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.charAt(0)}***@${domain}`;
}

/** Masks phone: +923001234567 → +92300***4567 */
function maskPhone(phone: string): string {
  if (phone.length <= 6) return '***';
  return `${phone.slice(0, Math.min(4, phone.length - 4))}***${phone.slice(-4)}`;
}

// ─── Core logger ──────────────────────────────────────────────────────────────

export const logger = {
  info:  (message: string, context?: unknown) => log('info',  message, context),
  warn:  (message: string, context?: unknown) => log('warn',  message, context),
  error: (message: string, context?: unknown) => log('error', message, context),
  debug: (message: string, context?: unknown) => log('debug', message, context),

  /** Structured log for an email delivery event (PII-safe) */
  logEmailEvent(event: EmailDeliveryEvent): void {
    const entry = {
      type: 'email_delivery',
      provider: event.provider,
      to: maskEmail(event.to),
      subject: event.subject,
      messageId: event.messageId,
      status: event.status,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      attemptNumber: event.attemptNumber,
      durationMs: event.durationMs,
      timestamp: new Date().toISOString(),
    };
    const level: LogLevel = event.status === 'failed' || event.status === 'bounced' ? 'error' : 'info';
    log(level, `[Email:${event.status}] → ${maskEmail(event.to)}`, entry);
  },
};

function log(level: LogLevel, message: string, context?: unknown) {
  // Strip any accidental credential leaks from context objects
  const sanitized = sanitizeContext(context);

  if (process.env.NODE_ENV === 'production') {
    // Structured JSON for log aggregators
    console.log(JSON.stringify({ level, message, context: sanitized, timestamp: new Date().toISOString() }));
  } else {
    // Pretty-print in development
    console[level === 'error' ? 'error' : 'log'](
      `[${level.toUpperCase()}]`, message, sanitized ?? ''
    );
  }

  // Asynchronously record error/warn entries to ErrorLog collection in DB
  if (level === 'error' || level === 'warn') {
    persistErrorLog(level, message, sanitized).catch(() => {});
  }
}

async function persistErrorLog(level: 'warn' | 'error', message: string, context?: unknown) {
  try {
    const mongoose = (await import("mongoose")).default;
    if (mongoose.connection?.readyState === 1) {
      const { ErrorLog } = await import("@/lib/models/ErrorLog");
      const ctxObj = (context && typeof context === 'object') ? (context as Record<string, any>) : {};
      const route = ctxObj.route || ctxObj.path || message.split(" ")[0] || "system";
      const stackSummary = ctxObj.stack || ctxObj.error || (ctxObj.message ? String(ctxObj.message) : undefined);

      await ErrorLog.create({
        route,
        message: message.slice(0, 500),
        stackSummary: stackSummary ? String(stackSummary).slice(0, 1000) : undefined,
        severity: level === 'error' ? 'error' : 'warn',
        userRole: ctxObj.userRole || "unauthenticated",
        timestamp: new Date(),
      });
    }
  } catch {
    // Logging failure must never break execution
  }
}

/** Recursively remove common credential key names from log payloads */
function sanitizeContext(ctx: unknown): unknown {
  if (!ctx || typeof ctx !== 'object') return ctx;
  const REDACTED_KEYS = new Set([
    'apiKey', 'api_key', 'authToken', 'auth_token', 'password',
    'secret', 'token', 'authorization', 'x-api-key',
  ]);
  return Object.fromEntries(
    Object.entries(ctx as Record<string, unknown>).map(([k, v]) => [
      k,
      REDACTED_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : sanitizeContext(v),
    ])
  );
}
