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
console.log('NODE_ENV:', process.env.NODE_ENV);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      console.log('Socket connection attempt from:', origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('Allowing connection with no origin');
        return callback(null, true);
      }

      // In production, allow same origin and configured origins
      if (process.env.NODE_ENV === 'production') {
        console.log('Production mode - allowing connection');
        return callback(null, true);
      }

      // In development, check against allowed origins
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log('Origin not in allowed list:', origin);
        return callback(new Error('Origin not allowed'));
      }

      console.log('Origin allowed:', origin);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST"]
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

// Store for online users
const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log('New socket connection attempt');
  
  // Get user ID from auth or query
  const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
  
  if (!userId) {
    console.log('No user ID provided - disconnecting socket');
    socket.disconnect();
    return;
  }

  console.log('User connected:', userId);
  
  // Store user's socket
  userSocketMap.set(userId, socket.id);
  
  // Emit online users to all clients
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  // Handle setup
  socket.on("setup", (userData) => {
    console.log('Socket setup for user:', userData);
    socket.join(userData);
  });

  // Handle post events
  socket.on("newPost", (post) => {
    if (!post?._id) {
      console.warn('Invalid post data received');
      return;
    }
    console.log('Broadcasting new post:', post._id);
    socket.broadcast.emit("newPost", post);
  });

  socket.on("updatePost", (post) => {
    if (!post?._id) {
      console.warn('Invalid post update received');
      return;
    }
    console.log('Broadcasting post update:', post._id);
    socket.broadcast.emit("updatePost", post);
  });

  socket.on("deletePost", (postId) => {
    if (!postId) {
      console.warn('Invalid post delete received');
      return;
    }
    console.log('Broadcasting post delete:', postId);
    socket.broadcast.emit("deletePost", postId);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log('User disconnected:', userId);
    userSocketMap.delete(userId);
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

export { app, server };
