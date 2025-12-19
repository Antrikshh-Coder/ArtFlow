import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["text", "system"],
      default: "text"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Message", messageSchema);
