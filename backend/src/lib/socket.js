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

console.log('Socket.io allowed origins:', allowedOrigins);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      console.log('Socket connection attempt from origin:', origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('Allowing connection with no origin');
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log('Origin not in allowed list:', origin);
        // In production, allow all origins
        if (process.env.NODE_ENV === 'production') {
          console.log('Allowing in production');
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed'));
      }
      
      console.log('Origin allowed:', origin);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  cookie: {
    name: "io",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === 'production'
  }
});

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log('New socket connection. Auth:', socket.handshake.auth);
  
  const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
  
  if (userId) {
    console.log('User connected:', userId);
    userSocketMap[userId] = socket.id;
    // Emit to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("setup", (userData) => {
    console.log('Socket setup for user:', userData);
    socket.join(userData); // Create a room for the user
  });

  // Handle post events
  socket.on("newPost", (post) => {
    console.log('New post received:', post?._id);
    if (!post?._id) return;
    socket.broadcast.emit("newPost", post);
  });

  socket.on("updatePost", (post) => {
    console.log('Post update received:', post?._id);
    if (!post?._id) return;
    socket.broadcast.emit("updatePost", post);
  });

  socket.on("deletePost", (postId) => {
    console.log('Post delete received:', postId);
    if (!postId) return;
    socket.broadcast.emit("deletePost", postId);
  });

  socket.on("disconnect", () => {
    console.log('User disconnected:', userId);
    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { app, server };
