import express from "express";
import Feature from "../models/Feature.js";
import auth from "../middleware/auth.js";
import { isAdmin } from "../middleware/admin.js";

const router = express.Router();

// PUBLIC
router.get("/", async (req, res) => {
  try {
    const features = await Feature.find().sort({ createdAt: -1 });
    res.json({ success: true, data: features });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ADMIN ONLY - CREATE
router.post("/", auth, isAdmin, async (req, res) => {
  try {
    const feature = await Feature.create(req.body);
    res.json({ success: true, data: feature });
  } catch (err) {
    res.status(400).json({ success: false });
  }
});

// ADMIN ONLY - DELETE
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    await Feature.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false });
  }
});

export default router;
