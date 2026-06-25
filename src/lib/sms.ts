import twilio from 'twilio';

// Initialize Twilio client if credentials exist
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSMS(to: string, message: string) {
  // If Twilio is configured, try to send real SMS
  if (client && fromNumber) {
    try {
      const response = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });
      console.log(`[Twilio SMS] Sent to ${to}: ${response.sid}`);
      return { success: true, provider: 'twilio' };
    } catch (error: any) {
      console.error(`[Twilio SMS Error] Failed to send SMS to ${to}:`, error);
      // Fallback to mock SMS if Twilio fails (e.g. unverified number in trial)
      console.log(`[Mock SMS Fallback] To: ${to} | Message: ${message}`);
      return { success: true, provider: 'mock (fallback)' };
    }
  }

  // Default to mock SMS for hackathon/development
  console.log('==================================================');
  console.log(`[MOCK SMS] To: ${to}`);
  console.log(`[MOCK SMS] Message: ${message}`);
  console.log('==================================================');
  
  return { success: true, provider: 'mock' };
}
