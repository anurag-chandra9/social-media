import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://social-media-cs6p.onrender.com"
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(null, true); // Allow all origins in production
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
  path: '/socket.io/',
  cookie: {
    name: "io",
    httpOnly: true,
    sameSite: "lax",
  }
});

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle post events
  socket.on("newPost", (post) => {
    socket.broadcast.emit("newPost", post);
  });

  socket.on("updatePost", (post) => {
    socket.broadcast.emit("updatePost", post);
  });

  socket.on("deletePost", (postId) => {
    socket.broadcast.emit("deletePost", postId);
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server };
