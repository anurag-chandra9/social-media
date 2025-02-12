import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  createPost,
  getFeedPosts,
  likeUnlikePost,
  addComment,
  deletePost,
  updatePost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.post("/create", protectRoute, upload.single("image"), createPost);
router.put("/:postId", protectRoute, upload.single("image"), updatePost);
router.put("/like/:postId", protectRoute, likeUnlikePost);
router.post("/comment/:postId", protectRoute, addComment);
router.delete("/:postId", protectRoute, deletePost);

export default router; 