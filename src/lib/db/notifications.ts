/**
 * @module notifications
 * @description Notification management module.
 * Uses Notification model (MongoDB / memory fallback) and fires background email notifications.
 */

import { connectDB } from "@/lib/db/connect";
import { Notification } from "@/lib/models/Notification";
import { User } from "@/lib/models/User";
import { sendNotificationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export interface MockNotification {
  _id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(userId: string): Promise<MockNotification[]> {
  try {
    await connectDB();
    const list = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
    return list.map((n: any) => ({
      _id: n._id.toString(),
      userId: n.userId,
      message: n.message,
      isRead: n.isRead,
      createdAt: new Date(n.createdAt).toISOString(),
    }));
  } catch (err) {
    logger.error("[getNotifications] Error:", err);
    return [];
  }
}

export async function addNotification(userId: string, message: string): Promise<MockNotification> {
  await connectDB();
  const notif = await Notification.create({
    userId,
    message,
    isRead: false,
  });

  // Non-blocking fire-and-forget email notification
  (async () => {
    try {
      await connectDB();
      const recipient = await User.findById(userId);
      if (recipient?.email) {
        await sendNotificationEmail(recipient.email, "New BloodMatch Notification", message);
      }
    } catch (err) {
      logger.error(`[addNotification:email] Failed to send email to user ${userId}:`, err);
    }
  })();

  return {
    _id: notif._id.toString(),
    userId: notif.userId,
    message: notif.message,
    isRead: notif.isRead,
    createdAt: new Date(notif.createdAt).toISOString(),
  };
}

export async function markAsRead(notificationId: string): Promise<void> {
  try {
    await connectDB();
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
  } catch (err) {
    logger.error("[markAsRead] Error:", err);
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  try {
    await connectDB();
    await Notification.updateMany({ userId }, { isRead: true });
  } catch (err) {
    logger.error("[markAllAsRead] Error:", err);
  }
}
