import mongoose from "mongoose";

const AnnotationSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tool: { type: String, enum: ["pen", "highlighter"], required: true },
  color: { type: String, required: true },
  imageData: String, // Base64 encoded drawing data
  comment: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  milestoneIndex: { type: Number, default: 0 }
});

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  amount: Number,
  status: {
    type: String,
    enum: ["pending", "in_progress", "submitted", "approved", "rejected"],
    default: "pending"
  },
  assets: [
    {
      url: String,
      filename: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  annotations: [AnnotationSchema]
});

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingCollaboratorEmails: [{ type: String, lowercase: true, trim: true }],
    milestones: [MilestoneSchema],
    status: { 
      type: String, 
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active" 
    },
    // Add drawing canvas reference
    canvasData: {
      currentVersion: String,
      versions: [{
        imageData: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        description: String
      }]
    }
  },
  { timestamps: true }
);

// Index for efficient queries
ProjectSchema.index({ client: 1, status: 1 });
ProjectSchema.index({ artist: 1, status: 1 });

export default mongoose.model("Project", ProjectSchema);
