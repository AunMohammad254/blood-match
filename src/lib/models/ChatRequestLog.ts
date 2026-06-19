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

// TTL Index: automatically expire documents 24 hours after their timestamp
ChatRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

// Compound index for efficient querying of request counts
ChatRequestLogSchema.index({ ip: 1, modelName: 1, timestamp: -1 });

import { memoryLogs, pushChatLog } from "@/lib/db/memoryStore";

interface MockChatRequestLog {
  ip: string;
  modelName: string;
  timestamp: Date;
}

class MockLogQuery<T> {
  constructor(private data: T[]) {}
  sort(criteria: any) {
    this.data.sort((a, b) => new Date((b as any).timestamp).getTime() - new Date((a as any).timestamp).getTime());
    return this;
  }
  skip(n: number) {
    this.data = this.data.slice(n);
    return this;
  }
  limit(n: number) {
    this.data = this.data.slice(0, n);
    return this;
  }
  lean() {
    return this;
  }
  then(onfulfilled?: ((value: T[]) => any) | null, onrejected?: ((reason: any) => any) | null): Promise<any> {
    return Promise.resolve(this.data).then(onfulfilled, onrejected);
  }
}

const ChatRequestLogMemoryModel = {
  create: async (data: any) => {
    const newLog: MockChatRequestLog = {
      ip: data.ip,
      modelName: data.modelName,
      timestamp: data.timestamp || new Date(),
    };
    pushChatLog(newLog);
    return newLog;
  },
  find: (query: any) => {
    let matches = [...memoryLogs];
    if (query && query.ip) {
      if (typeof query.ip === "object" && query.ip.$regex) {
        const regex = new RegExp(query.ip.$regex, "i");
        matches = matches.filter((l) => regex.test(l.ip));
      } else {
        matches = matches.filter((l) => l.ip === query.ip);
      }
    }
    if (query && query.modelName) {
      if (typeof query.modelName === "object" && query.modelName.$regex) {
        const regex = new RegExp(query.modelName.$regex, "i");
        matches = matches.filter((l) => regex.test(l.modelName));
      } else {
        matches = matches.filter((l) => l.modelName === query.modelName);
      }
    }
    return new MockLogQuery(matches);
  },
  countDocuments: async (query: any) => {
    let matches = memoryLogs;
    if (query && query.ip) {
      if (typeof query.ip === "object" && query.ip.$regex) {
        const regex = new RegExp(query.ip.$regex, "i");
        matches = matches.filter((l) => regex.test(l.ip));
      } else {
        matches = matches.filter((l) => l.ip === query.ip);
      }
    }
    if (query && query.modelName) {
      if (typeof query.modelName === "object" && query.modelName.$regex) {
        const regex = new RegExp(query.modelName.$regex, "i");
        matches = matches.filter((l) => regex.test(l.modelName));
      } else {
        matches = matches.filter((l) => l.modelName === query.modelName);
      }
    }
    if (query && query.timestamp && query.timestamp.$gte) {
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
