import mongoose, { Schema, Document } from "mongoose";

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    model?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    messages: [
      {
        role: { type: String, required: true, enum: ["user", "assistant"] },
        content: { type: String, required: true },
        model: { type: String }
      }
    ]
  },
  { timestamps: true }
);

// Index to quickly query history sorted by last updated
ChatHistorySchema.index({ userId: 1, updatedAt: -1 });

interface MockChatHistory {
  _id: string;
  userId: string;
  title: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    model?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const memoryChatHistories: MockChatHistory[] = [];

class MockChatQuery<T> {
  constructor(private data: T | null, private isArray: boolean = false) {}
  sort(criteria: any) {
    if (this.isArray && Array.isArray(this.data)) {
      this.data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return this;
  }
  limit(n: number) {
    if (this.isArray && Array.isArray(this.data)) {
      this.data = this.data.slice(0, n) as any;
    }
    return this;
  }
  then(onfulfilled?: ((value: T | null) => any) | null, onrejected?: ((reason: any) => any) | null): Promise<any> {
    return Promise.resolve(this.data).then(onfulfilled, onrejected);
  }
}

const ChatHistoryMemoryModel = {
  findOne: (query: any) => {
    const match = memoryChatHistories.find((c) => c._id === query._id && c.userId === query.userId);
    return new MockChatQuery(match || null, false);
  },
  find: (query: any) => {
    const matches = memoryChatHistories.filter((c) => c.userId === query.userId);
    return new MockChatQuery([...matches], true);
  },
  create: async (data: any) => {
    const newSession: MockChatHistory = {
      ...data,
      _id: "chat_" + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryChatHistories.push(newSession);
    return newSession;
  },
  findOneAndUpdate: async (query: any, update: any, options?: any) => {
    const idx = memoryChatHistories.findIndex((c) => c._id === query._id && c.userId === query.userId);
    if (idx === -1) return null;
    const current = memoryChatHistories[idx];
    
    // Apply updates
    let updatedMessages = [...current.messages];
    if (update.$push && update.$push.messages) {
      if (update.$push.messages.$each) {
        updatedMessages.push(...update.$push.messages.$each);
      } else {
        updatedMessages.push(update.$push.messages);
      }
    }
    
    const updated = {
      ...current,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };
    memoryChatHistories[idx] = updated;
    return updated;
  },
  deleteOne: async (query: any) => {
    const idx = memoryChatHistories.findIndex((c) => c._id === query._id && c.userId === query.userId);
    if (idx === -1) return { deletedCount: 0 };
    memoryChatHistories.splice(idx, 1);
    return { deletedCount: 1 };
  },
  countDocuments: async (query: any) => {
    return memoryChatHistories.filter((c) => c.userId === query.userId).length;
  }
};

const MongooseChatHistory =
  mongoose.models.ChatHistory ??
  mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);

export const ChatHistory = process.env.MONGODB_URI ? MongooseChatHistory : (ChatHistoryMemoryModel as any);
