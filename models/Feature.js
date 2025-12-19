import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    emoji: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Feature", FeatureSchema);
