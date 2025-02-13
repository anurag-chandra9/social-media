import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { usePostStore } from "./usePostStore.js";

// Get the socket URL from environment or fallback to window.location.origin
const SOCKET_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === "development" 
    ? "http://localhost:3001"
    : window.location.origin);

console.log('Socket URL:', SOCKET_URL);

const validateUserData = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!data._id || typeof data._id !== 'string') return false;
  if (!data.username || typeof data.username !== 'string') return false;
  return true;
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
        get().connectSocket(); // Reconnect socket if needed
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
      console.log('Login request:', { ...data, password: '[REDACTED]' });
      const res = await axiosInstance.post("/auth/login", data);
      console.log('Login response:', { ...res.data, _id: res.data?._id ? '[EXISTS]' : '[MISSING]' });
      
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
    const { authUser, socket, socketConnected } = get();
    
    // Don't proceed if already connected or no valid user
    if (socketConnected || !validateUserData(authUser)) {
      console.log("Socket connection skipped:", { 
        socketConnected, 
        hasValidUser: validateUserData(authUser) 
      });
      return;
    }

    try {
      // Clean up existing socket if any
      get().disconnectSocket();

      console.log("Creating new socket connection to:", SOCKET_URL);
      const newSocket = io(SOCKET_URL, {
        path: '/socket.io/',
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        query: { userId: authUser._id },
        auth: { userId: authUser._id }
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
          if (reason === "io server disconnect") {
            setTimeout(() => newSocket.connect(), 1000);
          }
        },
        getOnlineUsers: (users) => {
          if (Array.isArray(users)) {
            console.log("Online users:", users);
            set({ onlineUsers: users });
          }
        },
        newPost: (post) => {
          if (!post?._id) return;
          console.log("New post received:", post);
          usePostStore.getState().handleNewPost(post);
        },
        updatePost: (post) => {
          if (!post?._id) return;
          console.log("Post update received:", post);
          usePostStore.getState().handlePostUpdate(post);
        },
        deletePost: (postId) => {
          if (!postId) return;
          console.log("Post delete received:", postId);
          usePostStore.getState().handlePostDelete(postId);
        },
        error: (error) => {
          console.error("Socket error:", error);
          set({ socketConnected: false });
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
      socket.disconnect();
    } catch (error) {
      console.error("Error disconnecting socket:", error);
    } finally {
      set({ socket: null, socketConnected: false, onlineUsers: [] });
    }
  }
}));
