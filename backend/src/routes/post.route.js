import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload, handleMulterError } from "../middleware/multer.middleware.js";
import {
  createPost,
  getFeedPosts,
  likeUnlikePost,
  addComment,
  deletePost,
  updatePost,
} from "../controllers/post.controller.js";

const router = express.Router();

// Get all posts for news feed
router.get("/feed", protectRoute, getFeedPosts);

// Create a new post with optional image
router.post(
  "/create",
  protectRoute,
  upload.single("image"),
  handleMulterError,
  createPost
);

// Update a post with optional image
router.put(
  "/:postId",
  protectRoute,
  upload.single("image"),
  handleMulterError,
  updatePost
);

// Like/Unlike a post
router.put("/like/:postId", protectRoute, likeUnlikePost);

// Add a comment to a post
router.post("/comment/:postId", protectRoute, addComment);

// Delete a post
router.delete("/:postId", protectRoute, deletePost);

export default router; 