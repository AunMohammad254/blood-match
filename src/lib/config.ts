import { logger } from "@/lib/logger";

// ─── Validation helpers ────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[Config] Missing required environment variable in production: ${key}`
      );
    }
    logger.warn(`[Config] ⚠️  Missing env var: ${key} (acceptable in dev)`);
    return "";
  }
  return value.trim();
}

function optionalEnv(key: string, fallback = ""): string {
  return (process.env[key] ?? fallback).trim();
}

function requireEnvInProduction(key: string, devFallback: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[Config] ${key} must be set in production`
      );
    }
    logger.warn(`[Config] ⚠️  Using fallback for ${key} in development`);
    return devFallback;
  }
  return value.trim();
}

// ─── Config object ─────────────────────────────────────────────────────────────

export const config = {
  // ── App ──────────────────────────────────────────────────────────────────────
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  isProduction: process.env.NODE_ENV === "production",

  // ── Database ─────────────────────────────────────────────────────────────────
  mongoUri: requireEnv("MONGODB_URI"),

  // ── Auth ─────────────────────────────────────────────────────────────────────
  jwtSecret: requireEnvInProduction(
    "JWT_SECRET",
    "dev_secret_not_for_production_must_be_32_chars_minimum"
  ),

  // ── AI ───────────────────────────────────────────────────────────────────────
  geminiApiKey: optionalEnv("GEMINI_API_KEY"),

  // ── Email — Brevo (Sendinblue) SMTP ──────────────────────────────────────────
  // Nodemailer uses Brevo SMTP in production/dev when configured.
  // In development without SMTP vars, it auto-creates an Ethereal test account.
  // In production without SMTP vars, the app will throw at startup.
  email: {
    host: optionalEnv("SMTP_HOST", "smtp-relay.brevo.com"),
    port: Number(optionalEnv("SMTP_PORT", "587")),
    user: optionalEnv("SMTP_USER"),
    pass: optionalEnv("SMTP_PASS"),
    from: optionalEnv("EMAIL_FROM", "noreply@bloodmatch.local"),
    fromName: optionalEnv("EMAIL_FROM_NAME", "BloodMatch"),
    adminAlertEmail: optionalEnv("ADMIN_ALERT_EMAIL"),
    get isConfigured(): boolean {
      const u = process.env.SMTP_USER || "";
      const isPlaceholder = u.includes("your_") || u.includes("example.com");
      return !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        !isPlaceholder
      );
    },
  },
} as const;
