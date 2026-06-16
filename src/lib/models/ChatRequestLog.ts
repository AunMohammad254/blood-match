import mongoose, { Schema, Document } from "mongoose";

export interface IChatRequestLog extends Document {
  ip: string;
  modelName: string;
  timestamp: Date;
}

const ChatRequestLogSchema = new Schema<IChatRequestLog>({
  ip: { type: String, required: true },
  modelName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// TTL Index: automatically expire documents 60 seconds after their timestamp
ChatRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 });

// Compound index for efficient querying of request counts
ChatRequestLogSchema.index({ ip: 1, modelName: 1, timestamp: -1 });

interface MockChatRequestLog {
  ip: string;
  modelName: string;
  timestamp: Date;
}

const memoryLogs: MockChatRequestLog[] = [];

const ChatRequestLogMemoryModel = {
  create: async (data: any) => {
    const newLog: MockChatRequestLog = {
      ip: data.ip,
      modelName: data.modelName,
      timestamp: data.timestamp || new Date(),
    };
    memoryLogs.push(newLog);
    return newLog;
  },
  countDocuments: async (query: any) => {
    let matches = memoryLogs;
    if (query.ip) {
      matches = matches.filter((l) => l.ip === query.ip);
    }
    if (query.modelName) {
      matches = matches.filter((l) => l.modelName === query.modelName);
    }
    if (query.timestamp && query.timestamp.$gte) {
      const gteDate = new Date(query.timestamp.$gte);
      matches = matches.filter((l) => l.timestamp.getTime() >= gteDate.getTime());
    }
    return matches.length;
  }
};

const MongooseChatRequestLog =
  mongoose.models.ChatRequestLog ??
  mongoose.model<IChatRequestLog>("ChatRequestLog", ChatRequestLogSchema);

export const ChatRequestLog = process.env.MONGODB_URI ? MongooseChatRequestLog : (ChatRequestLogMemoryModel as any);
