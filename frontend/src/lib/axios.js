import axios from "axios";

const baseURL = import.meta.env.MODE === "development" 
  ? "http://localhost:3001/api"
  : `${window.location.origin}/api`;

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000, // Increased timeout for file uploads
  headers: {
    "Content-Type": "multipart/form-data", // Changed for file uploads
  },
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      console.log('Sending FormData:', {
        url: config.url,
        method: config.method,
        hasFile: Array.from(config.data.entries()).some(([_, value]) => value instanceof File)
      });
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
