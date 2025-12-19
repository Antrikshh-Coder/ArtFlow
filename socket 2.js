import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Project from "./models/Project.js";
import Message from "./models/Message.js";
import Activity from "./models/Activity.js";

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"]
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name email");
      if (!user) {
        return next(new Error("Authentication error"));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      };
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  const canAccessProject = async (userId, projectId) => {
    const project = await Project.findById(projectId);
    if (!project) return { ok: false, reason: "Project not found" };

    const isCollaborator = project.collaborators?.some(
      (c) => c.toString() === userId
    );

    if (
      project.client.toString() !== userId &&
      (!project.artist || project.artist.toString() !== userId) &&
      !isCollaborator
    ) {
      return { ok: false, reason: "Not authorized" };
    }

    return { ok: true, project };
  };

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.name})`);

    // Join project rooms for real-time collaboration
    socket.on("join-project", async (projectId, ack) => {
      try {
        const access = await canAccessProject(socket.user.id, projectId);
        if (!access.ok) {
          ack?.({ ok: false, message: access.reason });
          return;
        }

        socket.join(`project-${projectId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, message: "Join failed" });
      }
    });

    socket.on("leave-project", (projectId) => {
      socket.leave(`project-${projectId}`);
    });

    socket.on("chat:send", async (data, ack) => {
      try {
        const { projectId, content } = data || {};
        const trimmed = String(content || "").trim();
        if (!projectId || !trimmed) {
          ack?.({ ok: false, message: "Invalid message" });
          return;
        }

        const access = await canAccessProject(socket.user.id, projectId);
        if (!access.ok) {
          ack?.({ ok: false, message: access.reason });
          return;
        }

        const message = await Message.create({
          project: projectId,
          sender: socket.user.id,
          content: trimmed
        });

        const populatedMessage = await Message.findById(message._id).populate(
          "sender",
          "name email"
        );

        try {
          const snippet = String(trimmed).slice(0, 120);
          await Activity.create({
            project: access.project._id,
            actor: socket.user.id,
            type: "chat_message",
            message: `${socket.user.name} sent a message: ${snippet}`,
            meta: { messageId: message._id }
          });
        } catch (err) {
          console.error("ACTIVITY LOG ERROR:", err);
        }

        io.to(`project-${projectId}`).emit("chat:new", populatedMessage);
        ack?.({ ok: true, message: populatedMessage });
      } catch (err) {
        ack?.({ ok: false, message: "Failed to send" });
      }
    });

    socket.on("annotation:created", async (data, ack) => {
      try {
        const { projectId, annotation } = data || {};
        if (!projectId || !annotation) {
          ack?.({ ok: false, message: "Invalid annotation" });
          return;
        }

        const access = await canAccessProject(socket.user.id, projectId);
        if (!access.ok) {
          ack?.({ ok: false, message: access.reason });
          return;
        }

        socket.to(`project-${projectId}`).emit("annotation:new", {
          projectId,
          annotation
        });
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, message: "Broadcast failed" });
      }
    });

    // Real-time milestone updates
    socket.on("milestone-updated", (data) => {
      const { projectId, milestoneIndex, status } = data;
      
      socket.to(`project-${projectId}`).emit("milestone-status-updated", {
        projectId,
        milestoneIndex,
        status,
        updatedBy: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // File upload notifications
    socket.on("file-uploaded", (data) => {
      const { projectId, milestoneIndex, filename } = data;
      
      socket.to(`project-${projectId}`).emit("new-file-notification", {
        projectId,
        milestoneIndex,
        filename,
        uploadedBy: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Canvas drawing synchronization
    socket.on("canvas-update", (data) => {
      const { projectId, imageData } = data;
      
      socket.to(`project-${projectId}`).emit("canvas-update", {
        projectId,
        imageData,
        updatedBy: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};
