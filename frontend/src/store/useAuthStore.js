import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { usePostStore } from "./usePostStore.js";

// In development use localhost, in production use relative path
const SOCKET_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:3001"
  : ""; // Empty string means same origin in production

console.log('Socket URL:', SOCKET_URL || 'same origin');

const validateUserData = (data) => {
  try {
    if (!data || typeof data !== 'object') return false;
    if (!data._id || typeof data._id !== 'string') return false;
    if (!data.username || typeof data.username !== 'string') return false;
    return true;
  } catch (error) {
    console.error('Error validating user data:', error);
    return false;
  }
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  socketConnected: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      console.log("CheckAuth response:", res.data);
      
      if (validateUserData(res.data)) {
        set({ authUser: res.data });
        // Don't connect socket here, let the component handle it
      } else {
        console.warn("Invalid user data received from checkAuth:", res.data);
        set({ authUser: null });
        get().disconnectSocket();
      }
    } catch (error) {
      console.error("Error in checkAuth:", error);
      set({ authUser: null });
      get().disconnectSocket();
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      console.log("Signup response:", res.data);
      
      if (validateUserData(res.data)) {
        set({ authUser: res.data });
        toast.success("Account created successfully");
      } else {
        throw new Error('Invalid user data received from signup');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.message || "Error creating account");
      set({ authUser: null });
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      console.log("Login response:", res.data);
      
      if (validateUserData(res.data)) {
        set({ authUser: res.data });
        toast.success("Logged in successfully");
      } else {
        throw new Error('Invalid user data received from login');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || "Error logging in");
      set({ authUser: null });
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    const cleanup = () => {
      get().disconnectSocket();
      set({ authUser: null, socket: null, onlineUsers: [] });
    };

    try {
      await axiosInstance.post("/auth/logout");
      cleanup();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.response?.data?.message || "Error logging out");
      cleanup(); // Clean up anyway
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      if (validateUserData(res.data)) {
        set({ authUser: res.data });
        toast.success("Profile updated successfully");
      } else {
        throw new Error('Invalid user data received from profile update');
      }
    } catch (error) {
      console.error("Error in update profile:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    
    if (!authUser?._id) {
      console.warn("Cannot connect socket: No user ID available");
      return;
    }

    if (socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    try {
      // Clean up existing socket if any
      get().disconnectSocket();

      console.log("Creating new socket connection for user:", authUser._id);
      const newSocket = io(SOCKET_URL, {
        path: '/socket.io',
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: { userId: authUser._id },
        query: { userId: authUser._id }
      });

      // Socket event handlers
      const handlers = {
        connect: () => {
          console.log("Socket connected successfully");
          set({ socketConnected: true });
          newSocket.emit("setup", authUser._id);
        },
        connect_error: (error) => {
          console.error("Socket connection error:", error);
          set({ socketConnected: false });
        },
        disconnect: (reason) => {
          console.log("Socket disconnected:", reason);
          set({ socketConnected: false });
        },
        getOnlineUsers: (users) => {
          if (!Array.isArray(users)) {
            console.warn("Invalid online users data received:", users);
            return;
          }
          console.log("Online users:", users);
          set({ onlineUsers: users });
        },
        newPost: (post) => {
          if (!post?._id) {
            console.warn("Invalid post data received");
            return;
          }
          usePostStore.getState().handleNewPost(post);
        },
        updatePost: (post) => {
          if (!post?._id) {
            console.warn("Invalid post update received");
            return;
          }
          usePostStore.getState().handlePostUpdate(post);
        },
        deletePost: (postId) => {
          if (!postId) {
            console.warn("Invalid post delete received");
            return;
          }
          usePostStore.getState().handlePostDelete(postId);
        }
      };

      // Attach all event handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        newSocket.on(event, handler);
      });

      set({ socket: newSocket });
    } catch (error) {
      console.error("Error setting up socket connection:", error);
      set({ socket: null, socketConnected: false });
    }
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (!socket) return;

    try {
      console.log("Disconnecting socket");
      // Remove all listeners before disconnecting
      socket.removeAllListeners();
      socket.disconnect();
    } catch (error) {
      console.error("Error disconnecting socket:", error);
    } finally {
      set({ socket: null, socketConnected: false, onlineUsers: [] });
    }
  }
}));
