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

export const ChatHistory =
  mongoose.models.ChatHistory ??
  mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);
