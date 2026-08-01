/**
 * @module email
 * @description Single entry point for all outgoing email using Nodemailer.
 * Supports Brevo SMTP in production/dev, Ethereal auto-fallback in dev when unconfigured,
 * and fail-fast in production if SMTP credentials are missing.
 */

import nodemailer from "nodemailer";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporterInstance: nodemailer.Transporter | null = null;
let isEthereal = false;

function isPlaceholderValue(val?: string): boolean {
  if (!val) return true;
  const lower = val.toLowerCase().trim();
  return lower.includes("your_") || lower.includes("example.com") || lower === "your_smtp_user";
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterInstance) {
    return transporterInstance;
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST;

  const hasSmtp =
    !!host && !!user && !!pass && !isPlaceholderValue(user) && !isPlaceholderValue(pass);

  if (hasSmtp) {
    transporterInstance = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user,
        pass,
      },
    });
    return transporterInstance;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[Email] Missing or unconfigured SMTP credentials in production (SMTP_HOST, SMTP_USER, SMTP_PASS required)."
    );
  }

  if (user && isPlaceholderValue(user)) {
    logger.warn(
      `[Email] ⚠️ SMTP_USER is set to placeholder "${user}". Update it in .env.local with your real Brevo login email.`
    );
  }

  logger.warn(
    "[Email] ⚠️ Operating in development mode using auto-generated Ethereal test account..."
  );

  const testAccount = await nodemailer.createTestAccount();
  transporterInstance = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  isEthereal = true;
  logger.info(`[Email] Ethereal test account created: ${testAccount.user}`);
  return transporterInstance;
}

/**
 * Core sendEmail function using Nodemailer
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
  try {
    const transporter = await getTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || "BloodMatch";
    const fromAddr = process.env.EMAIL_FROM || "noreply@bloodmatch.local";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ""),
    });

    logger.info(`[Email:sent] To: ${to} | Subject: "${subject}" | MessageID: ${info.messageId}`);

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info(`[Email:EtherealPreview] 🔗 Preview URL: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`[Email:error] Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Helper to send OTP verification email
 */
export async function sendOtpEmail(to: string, otp: string): Promise<{ success: boolean }> {
  const subject = `${otp} is your BloodMatch verification code`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #DC2626; margin-bottom: 8px;">BloodMatch Email Verification</h2>
      <p style="font-size: 14px; color: #4B5563;">Use the verification code below to verify your email address. This code is valid for 5 minutes.</p>
      <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #991B1B; margin: 20px 0; border-radius: 8px;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #9CA3AF;">If you did not request this code, please ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Helper to send in-app notification copy as email
 */
export async function sendNotificationEmail(to: string, subject: string, message: string): Promise<{ success: boolean }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #DC2626; margin-bottom: 8px;">BloodMatch Notification</h2>
      <p style="font-size: 15px; color: #1F2937; line-height: 1.5; margin: 16px 0;">${message}</p>
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9CA3AF;">You received this email because you have notifications enabled on BloodMatch.</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Helper to send admin alert emails
 */
export async function sendAdminAlertEmail(subject: string, message: string): Promise<{ success: boolean } | null> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || config.email.adminAlertEmail;
  if (!adminEmail) {
    logger.warn("[Email:adminAlert] Skipping admin alert — ADMIN_ALERT_EMAIL not configured.");
    return null;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #EF4444; border-radius: 8px; background-color: #FEF2F2;">
      <h2 style="color: #991B1B; margin-bottom: 8px;">🚨 Admin Alert: ${subject}</h2>
      <p style="font-size: 14px; color: #7F1D1D; line-height: 1.5; margin: 16px 0;">${message}</p>
      <p style="font-size: 12px; color: #991B1B;">BloodMatch Administrative System Alert</p>
    </div>
  `;

  return sendEmail({ to: adminEmail, subject: `[ADMIN ALERT] ${subject}`, html });
}
