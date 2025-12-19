import { io } from "socket.io-client";

export const socket = io("http://localhost:5173", {
  autoConnect: false,
  transports: ["websocket"],
  auth: {
    token: null
  }
});

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
