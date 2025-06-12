import { Server } from "socket.io";
import { allowedOrigins } from "./constants";
import server from "./create.server";
import logger from "../config/logger";

console.log(`Server running on ${server} ${logger}`);


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  logger.info(`user connected ${socket.id}`);
  socket.on("disconnect", () => {
    logger.info("user disconnected");
  });
});

export default io;
