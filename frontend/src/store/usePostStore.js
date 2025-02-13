import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const usePostStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  isEditing: false,
  editingPost: null,

  // Socket event handlers
  handleNewPost: (post) => {
    set((state) => ({ posts: [post, ...state.posts] }));
  },

  handlePostUpdate: (updatedPost) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      ),
    }));
  },

  handlePostDelete: (postId) => {
    set((state) => ({
      posts: state.posts.filter((post) => post._id !== postId),
    }));
  },

  // Get all posts for news feed
  getFeedPosts: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/posts/feed");
      set({ posts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching posts");
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new post
  createPost: async (data) => {
    set({ isLoading: true });
    try {
      console.log('Sending post data to server...');
      const res = await axiosInstance.post("/posts/create", data);
      console.log('Server response:', res.data);
      
      if (!res.data) {
        throw new Error('No response data from server');
      }

      // Verify the post data
      if (data.get('image') && !res.data.image) {
        console.warn('Image was sent but no image URL in response:', res.data);
      }

      set((state) => ({ posts: [res.data, ...state.posts] }));
      toast.success("Post created successfully");
      
      // Emit socket event
      useAuthStore.getState().socket?.emit("newPost", res.data);
      
      return res.data;
    } catch (error) {
      console.error('Error in createPost:', error);
      toast.error(error.response?.data?.message || "Error creating post");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Edit post
  setEditingPost: (post) => {
    set({ editingPost: post, isEditing: true });
  },

  clearEditingPost: () => {
    set({ editingPost: null, isEditing: false });
  },

  updatePost: async (postId, data) => {
    try {
      const res = await axiosInstance.put(`/posts/${postId}`, data);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? res.data : post
        ),
        editingPost: null,
        isEditing: false,
      }));
      toast.success("Post updated successfully");
      
      // Emit socket event
      useAuthStore.getState().socket?.emit("updatePost", res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating post");
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      await axiosInstance.delete(`/posts/${postId}`);
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }));
      toast.success("Post deleted successfully");
      
      // Emit socket event
      useAuthStore.getState().socket?.emit("deletePost", postId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting post");
    }
  },

  // Like or unlike a post
  likeUnlikePost: async (postId) => {
    try {
      const res = await axiosInstance.put(`/posts/like/${postId}`);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? res.data : post
        ),
      }));
      
      // Emit socket event
      useAuthStore.getState().socket?.emit("updatePost", res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error liking post");
    }
  },

  // Add a comment to a post
  addComment: async (postId, content) => {
    try {
      const res = await axiosInstance.post(`/posts/comment/${postId}`, {
        content,
      });
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? res.data : post
        ),
      }));
      toast.success("Comment added successfully");
      
      // Emit socket event
      useAuthStore.getState().socket?.emit("updatePost", res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding comment");
    }
  },
})); 