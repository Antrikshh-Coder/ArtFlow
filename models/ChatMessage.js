import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  attachments: [{ url: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("ChatMessage", ChatMessageSchema);
