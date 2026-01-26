import { Server } from "socket.io";
import { env } from "../../config/env.js";

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true }
  });

  io.on("connection", (socket) => {
    socket.on("join_area", (areaCode) => socket.join(`area:${areaCode}`));
  });

  return io;
};
