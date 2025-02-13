import Post from "../models/post.model.js";
import { uploadImage, deleteImage } from "../lib/cloudinary.js";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = "";

    console.log('Creating post with content:', content);
    console.log('Request headers:', req.headers);
    console.log('Request file details:', {
      exists: !!req.file,
      fileInfo: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: !!req.file.buffer
      } : null
    });

    if (req.file) {
      try {
        if (!req.file.buffer) {
          throw new Error('No file buffer found');
        }

        console.log('Attempting to upload image to Cloudinary...');
        imageUrl = await uploadImage(req.file);
        console.log('Image uploaded successfully to Cloudinary:', imageUrl);

        if (!imageUrl) {
          throw new Error('No image URL returned from Cloudinary');
        }
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return res.status(400).json({ 
          message: "Error uploading image",
          error: error.message 
        });
      }
    }

    console.log('Creating post with data:', {
      content,
      imageUrl,
      userId: req.user._id
    });

    const post = await Post.create({
      content,
      image: imageUrl,
      user: req.user._id,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("user", "-password")
      .populate("comments.user", "-password");

    console.log('Created post:', {
      id: populatedPost._id,
      content: populatedPost.content,
      image: populatedPost.image,
      user: populatedPost.user._id
    });

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Error in createPost: ", error);
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
      await deleteImage(post.image);
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
      try {
        // Delete old image if exists
        if (post.image) {
          await deleteImage(post.image);
        }
        // Upload new image
        imageUrl = await uploadImage(req.file);
      } catch (error) {
        return res.status(400).json({ message: "Error uploading image" });
      }
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