import axios from "axios";

// In production, use the same origin as the frontend since backend is served from the same domain
// In development, use the local development server
const baseURL = import.meta.env.MODE === "development" 
  ? "http://localhost:3001/api"
  : "/api"; // Just use /api in production since we're serving from same origin

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
    // Log more detailed error information
    if (error.response) {
      console.error("Response Error Data:", error.response.data);
      console.error("Response Error Status:", error.response.status);
      console.error("Response Error Headers:", error.response.headers);
    } else if (error.request) {
      console.error("Request Error:", error.request);
    } else {
      console.error("Error Message:", error.message);
    }
    console.error("Error Config:", error.config);
    
    return Promise.reject(error);
  }
);
