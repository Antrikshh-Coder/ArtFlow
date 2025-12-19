import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      }
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    googleSub: {
      type: String
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailOtpHash: {
      type: String
    },
    emailOtpExpiresAt: {
      type: Date
    },
    emailOtpSentAt: {
      type: Date
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;
