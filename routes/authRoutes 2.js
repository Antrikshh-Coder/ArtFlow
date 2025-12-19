import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Project from "../models/Project.js";
import crypto from "crypto";
import { sendEmailVerificationOtp } from "../services/emailOtpService.js";
import { OAuth2Client } from "google-auth-library";
import dns from "dns";

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const attachPendingCollaborations = async (userDoc) => {
  try {
    if (!userDoc?.email || !userDoc?._id) return;
    await Project.updateMany(
      { pendingCollaboratorEmails: userDoc.email },
      {
        $pull: { pendingCollaboratorEmails: userDoc.email },
        $addToSet: { collaborators: userDoc._id }
      }
    );
  } catch (err) {
    console.error("ATTACH PENDING COLLAB ERROR:", err);
  }
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const isValidEmail = (email) => {
  // Basic format check (real verification is OTP delivery)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const hasMxRecord = async (email) => {
  try {
    const domain = String(email).split("@")[1];
    if (!domain) return false;
    const mx = await dns.promises.resolveMx(domain);
    return Array.isArray(mx) && mx.length > 0;
  } catch {
    return false;
  }
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    console.log("REGISTER HIT", req.body);

    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: true,
      emailOtpHash: undefined,
      emailOtpExpiresAt: undefined,
      emailOtpSentAt: undefined
    });

    await attachPendingCollaborations(user);

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// VERIFY EMAIL
router.post("/verify-email", async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email required" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid verification request" });
    }

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailOtpHash = undefined;
      user.emailOtpExpiresAt = undefined;
      await user.save();
    }

    await attachPendingCollaborations(user);

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

// RESEND OTP
router.post("/resend-verification", async (req, res) => {
  try {
    return res.status(200).json({
      ok: true,
      message: "Email verification is disabled"
    });
  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    res.status(500).json({ message: "Resend failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN HIT", req.body);

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Please login with Google" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// GOOGLE LOGIN
router.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID not configured" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const sub = payload?.sub;
    const name = payload?.name || payload?.given_name || "Google User";

    if (!email || !sub) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        authProvider: "google",
        googleSub: sub,
        isEmailVerified: true
      });
    } else {
      if (!user.googleSub) {
        user.googleSub = sub;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
      }
      await user.save();
    }

    await attachPendingCollaborations(user);

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err);
    res.status(500).json({ message: "Google login failed" });
  }
});

export default router;
