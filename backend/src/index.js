import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import postRoutes from "./routes/post.route.js";
import { app, server } from "./lib/socket.js";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://social-media-cs6p.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log('Origin not allowed:', origin);
        return callback(null, true); // Allow all origins in production
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  // Get the correct path to the frontend build directory
  const frontendBuildPath = path.resolve(__dirname, '../../frontend/dist');
  console.log('Serving static files from:', frontendBuildPath);
  
  // Serve static files
  app.use(express.static(frontendBuildPath));
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  // Handle React routing - this should be after API routes
  app.get('/*', function (req, res) {
    console.log('Handling route:', req.url);
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'), function(err) {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send(err);
      }
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Start server
server.listen(PORT, () => {
  console.log('===========================================');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for origins:`, allowedOrigins);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📂 Serving frontend from: ${path.resolve(__dirname, '../../frontend/dist')}`);
  }
  console.log('===========================================');
  connectDB();
});
