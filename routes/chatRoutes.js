import express from "express";
import Message from "../models/Message.js";
import Project from "../models/Project.js";
import Activity from "../models/Activity.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all messages for a project
router.get("/project/:projectId", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isCollaborator = project.collaborators?.some(
      (c) => c.toString() === req.user._id.toString()
    );

    if (
      project.client.toString() !== req.user._id.toString() &&
      (!project.artist || project.artist.toString() !== req.user._id.toString()) &&
      !isCollaborator
    ) {
      return res.status(403).json({
        error: "Not authorized",
        message: "You do not have access to this project's chat"
      });
    }

    const messages = await Message.find({ project: req.params.projectId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post("/project/:projectId", auth, async (req, res) => {
  try {
    const { content } = req.body;

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isCollaborator = project.collaborators?.some(
      (c) => c.toString() === req.user._id.toString()
    );

    if (
      project.client.toString() !== req.user._id.toString() &&
      (!project.artist || project.artist.toString() !== req.user._id.toString()) &&
      !isCollaborator
    ) {
      return res.status(403).json({
        error: "Not authorized",
        message: "You do not have access to this project's chat"
      });
    }
    
    const message = await Message.create({
      project: req.params.projectId,
      sender: req.user._id,
      content
    });
    
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email");

    try {
      const snippet = String(content || "").trim().slice(0, 120);
      await Activity.create({
        project: project._id,
        actor: req.user._id,
        type: "chat_message",
        message: `${req.user?.name || "Someone"} sent a message: ${snippet}`,
        meta: { messageId: message._id }
      });
    } catch (err) {
      console.error("ACTIVITY LOG ERROR:", err);
    }
    
    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
