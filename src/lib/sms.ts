import twilio from 'twilio';
import { logger } from "@/lib/logger";

// Initialize Twilio client if credentials exist
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSMS(to: string, message: string) {
  // If Twilio is configured, try to send real SMS
  if (client && fromNumber) {
    try {
      // Fire-and-forget: we don't await this so it doesn't block API responses
      client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      }).then(response => {
        logger.info(`[Twilio SMS] Sent to ${to}: ${response.sid}`);
      }).catch(error => {
        logger.error(`[Twilio SMS Error] Failed to send SMS to ${to}:`, error);
        logger.info(`[Mock SMS Fallback] To: ${to} | Message: ${message}`);
      });
      return { success: true, provider: 'twilio-queued' };
    } catch (error) {
      logger.error(`[Twilio Setup Error] Failed to queue SMS for ${to}:`, error);
      return { success: true, provider: 'mock (fallback)' };
    }
  }

  // Default to mock SMS for hackathon/development
  logger.info('==================================================');
  logger.info(`[MOCK SMS] To: ${to}`);
  logger.info(`[MOCK SMS] Message: ${message}`);
  logger.info('==================================================');
  
  return { success: true, provider: 'mock' };
}
