import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatMessage from "../models/ChatMessage.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch {}
    }
    next();
  });

  io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("joinProject", ({ projectId }) => {
      socket.join(`project:${projectId}`);
    });

    socket.on("chat:message", async (payload) => {
      const saved = await ChatMessage.create(payload);
      io.to(`project:${payload.projectId}`).emit("chat:message", saved);
    });

    socket.on("annotation:create", (payload) => {
      io.to(`project:${payload.projectId}`).emit("annotation:created", payload);
    });
  });
};
