import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

// In-memory fallback model implementation when MONGODB_URI is not set
class NotificationMemoryModel {
  static store: Array<{ _id: string; userId: string; message: string; isRead: boolean; createdAt: Date }> = [];

  static async find(query: { userId?: string }) {
    let filtered = [...NotificationMemoryModel.store];
    if (query.userId) {
      filtered = filtered.filter((n) => n.userId === query.userId);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filtered;
  }

  static async create(doc: { userId: string; message: string; isRead?: boolean }) {
    const newNotif = {
      _id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      userId: doc.userId,
      message: doc.message,
      isRead: doc.isRead ?? false,
      createdAt: new Date(),
    };
    NotificationMemoryModel.store.push(newNotif);
    return newNotif;
  }

  static async findByIdAndUpdate(id: string, update: Record<string, unknown>) {
    const notif = NotificationMemoryModel.store.find((n) => n._id === id);
    if (notif) {
      if (typeof update.isRead === "boolean") {
        notif.isRead = update.isRead;
      }
    }
    return notif;
  }

  static async updateMany(query: { userId: string }, update: Record<string, unknown>) {
    let count = 0;
    NotificationMemoryModel.store.forEach((n) => {
      if (n.userId === query.userId) {
        if (typeof update.isRead === "boolean") {
          n.isRead = update.isRead;
        }
        count++;
      }
    });
    return { modifiedCount: count };
  }
}

const MongooseNotificationModel =
  mongoose.models.Notification ?? mongoose.model<INotification>("Notification", NotificationSchema);

export const Notification = process.env.MONGODB_URI
  ? MongooseNotificationModel
  : (NotificationMemoryModel as any);

