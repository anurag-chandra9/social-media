import Post from "../models/post.model.js";
import cloudinary from "../lib/cloudinary.js";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = "";

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const post = await Post.create({
      content,
      image: imageUrl,
      user: req.user._id,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("user", "-password")
      .populate("comments.user", "-password");

    res.status(201).json(populatedPost);
  } catch (error) {
    console.log("Error in createPost: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user is the owner of the post
    if (post.user.toString() !== userId.toString()) {
      return res.status(401).json({ message: "Unauthorized to delete this post" });
    }

    // Delete image from cloudinary if exists
    if (post.image) {
      const imageId = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imageId);
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in deletePost: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get all posts (news feed)
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "-password")
      .populate("comments.user", "-password")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like/Unlike a post
export const likeUnlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { likes: post.likes },
      { new: true }
    )
      .populate("user", "-password")
      .populate("comments.user", "-password");

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a comment
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user: userId, content });
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("user", "-password")
      .populate("comments.user", "-password");

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user is the owner of the post
    if (post.user.toString() !== userId.toString()) {
      return res.status(401).json({ message: "Unauthorized to update this post" });
    }

    let imageUrl = post.image; // Keep existing image by default

    if (req.file) {
      // Delete old image from cloudinary if exists
      if (post.image) {
        const imageId = post.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(imageId);
      }

      // Upload new image
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { content, image: imageUrl },
      { new: true }
    )
      .populate("user", "-password")
      .populate("comments.user", "-password");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log("Error in updatePost: ", error.message);
    res.status(500).json({ message: error.message });
  }
}; 