import axios from "axios";

const baseURL = import.meta.env.MODE === "development" 
  ? "http://localhost:3001/api"
  : `${window.location.origin}/api`;

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000, // Increased timeout for file uploads
  headers: {
    "Content-Type": "application/json", // Default to JSON
  },
});

// Add request interceptor for error handling
axiosInstance.interceptors.request.use(
  (config) => {
    // Set Content-Type to multipart/form-data only for FormData requests
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
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
