import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt.utils";

let io: Server;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.userName = payload.name;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.data.userId}`);

    socket.on("join_session", ({ session_id }: { session_id: string }) => {
      socket.join(`session:${session_id}`);
      console.log(
        `[Socket] ${socket.data.userId} joined session:${session_id}`,
      );
    });

    socket.on(
      "location:send",
      (payload: {
        session_id: string;
        latitude: number;
        longitude: number;
        accuracy_meters?: number;
      }) => {
        io.to(`session:${payload.session_id}`).emit("location:update", {
          user_id: socket.data.userId,
          name: socket.data.userName,
          latitude: payload.latitude,
          longitude: payload.longitude,
          accuracy_meters: payload.accuracy_meters,
          recorded_at: new Date().toISOString(),
        });
      },
    );

    socket.on("leave_session", ({ session_id }: { session_id: string }) => {
      socket.leave(`session:${session_id}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.data.userId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const broadcastToSession = (
  sessionId: string,
  event: string,
  payload: unknown,
): void => {
  getIO().to(`session:${sessionId}`).emit(event, payload);
};
