import { logger } from "@/lib/logger";
function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  jwtSecret: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    logger.warn('⚠️  Using fallback JWT secret in development');
    return 'dev_secret_not_for_production';
  })(),
  mongoUri: process.env.MONGODB_URI,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  geminiApiKey: process.env.GEMINI_API_KEY,
} as const;
