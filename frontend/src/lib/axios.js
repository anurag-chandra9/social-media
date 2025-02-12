import axios from "axios";

const baseURL = import.meta.env.MODE === "development" 
  ? "http://localhost:3002/api"
  : `${window.location.origin}/api`; // Use the same origin in production

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
