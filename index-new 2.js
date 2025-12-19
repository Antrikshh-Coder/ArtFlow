import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import connectDB from "./config/db.js";
import { initializeSocket } from "./socket.js";

import authRoutes from "./routes/authRoutes.js";
import featureRoutes from "./routes/features.js";
import projectRoutes from "./routes/projectRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();
const server = createServer(app);

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/features", featureRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/chat", chatRoutes);

// Initialize Socket.IO
const io = initializeSocket(server);

server.listen(5173, () =>
  console.log("Server running on port 5173 with Socket.IO")
);
