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
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://social-media-app-anurag.onrender.com" // Add your Render URL
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
  const frontendBuildPath = path.resolve(__dirname, '../../frontend/dist');
  
  // Serve frontend static files
  app.use(express.static(frontendBuildPath));

  // Handle React routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Frontend path: ${process.env.NODE_ENV === "production" ? path.resolve(__dirname, '../../frontend/dist') : 'Not serving frontend in development'}`);
  connectDB();
});
