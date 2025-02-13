import Post from "../models/post.model.js";
import { uploadImage, deleteImage } from "../lib/cloudinary.js";

// Create a new post
export const createPost = async (req, res) => {
  let imageUrl = "";
  
  try {
    const { content } = req.body;
    console.log('Creating post with:', {
      hasContent: !!content,
      hasFile: !!req.file,
      fileDetails: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        hasBuffer: !!req.file.buffer,
        bufferLength: req.file.buffer?.length
      } : null
    });

    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Handle image upload if present
    if (req.file) {
      try {
        console.log('Starting image upload to Cloudinary...');
        
        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
          throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error(`Invalid file type. Allowed types are: ${allowedTypes.join(', ')}`);
        }

        // Upload to Cloudinary
        imageUrl = await uploadImage(req.file);
        
        if (!imageUrl) {
          console.error('Cloudinary upload failed - no URL returned');
          throw new Error('Failed to upload image');
        }

        console.log('Image uploaded successfully:', imageUrl);
      } catch (error) {
        console.error('Image upload error:', {
          message: error.message,
          stack: error.stack,
          file: {
            fieldname: req.file.fieldname,
            size: req.file.size,
            type: req.file.mimetype,
            name: req.file.originalname,
            hasBuffer: !!req.file.buffer
          }
        });
        return res.status(400).json({ 
          message: `Error uploading image: ${error.message}`,
          details: error.message
        });
      }
    }

    // Create post
    const post = await Post.create({
      content: content.trim(),
      image: imageUrl,
      user: req.user._id,
    });

    // Populate user data
    const populatedPost = await Post.findById(post._id)
      .populate("user", "-password")
      .populate("comments.user", "-password");

    console.log('Post created successfully:', {
      id: populatedPost._id,
      hasImage: !!populatedPost.image,
      imageUrl: populatedPost.image,
      content: populatedPost.content
    });

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Error creating post:", {
      message: error.message,
      stack: error.stack,
      hasImage: !!imageUrl,
      imageUrl
    });

    // Clean up uploaded image if post creation fails
    if (imageUrl) {
      try {
        await deleteImage(imageUrl);
        console.log('Cleaned up image after failed post creation');
      } catch (cleanupError) {
        console.error('Error cleaning up image:', cleanupError);
      }
    }

    res.status(500).json({ 
      message: error.message || "Error creating post",
      details: error.message
    });
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
      try {
        await deleteImage(post.image);
        console.log('Image deleted from Cloudinary');
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Continue with post deletion even if image deletion fails
      }
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

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user: userId, content: content.trim() });
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

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

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
        // Validate file size (5MB)
        if (req.file.size > 5 * 1024 * 1024) {
          throw new Error('File size too large. Maximum size is 5MB');
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
          throw new Error('Invalid file type. Only images are allowed');
        }

        // Delete old image if exists
        if (post.image) {
          await deleteImage(post.image);
        }

        // Upload new image
        imageUrl = await uploadImage(req.file);
        
        if (!imageUrl) {
          throw new Error('Failed to upload new image');
        }
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { 
        content: content.trim(), 
        image: imageUrl 
      },
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