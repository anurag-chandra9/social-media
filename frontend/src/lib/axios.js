import axios from "axios";

// In development use localhost, in production use relative path
const baseURL = import.meta.env.MODE === "development" 
  ? "http://localhost:3001/api"
  : "/api"; // Using relative path in production for better portability

console.log('API baseURL:', baseURL);

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json", // Default to JSON
  },
});

// Helper to determine if request includes files
const hasFiles = (data) => {
  if (!data) return false;
  if (data instanceof FormData) {
    for (let [key, value] of data.entries()) {
      if (value instanceof File || value instanceof Blob) return true;
    }
    return false;
  }
  return Object.values(data).some(value => value instanceof File || value instanceof Blob);
};

// Add request interceptor for content type and error handling
axiosInstance.interceptors.request.use(
  (config) => {
    // Set appropriate Content-Type for file uploads
    if (config.data && hasFiles(config.data)) {
      console.log('Request contains files, setting multipart/form-data');
      delete config.headers["Content-Type"]; // Let the browser set it
    }
    
    // Log request in development
    if (import.meta.env.MODE === "development") {
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        data: config.data instanceof FormData 
          ? Object.fromEntries(Array.from(config.data.entries()).map(([key, value]) => [
              key,
              value instanceof File 
                ? { name: value.name, type: value.type, size: value.size }
                : value
            ]))
          : config.data
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
  (response) => {
    // Log response in development
    if (import.meta.env.MODE === "development") {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data instanceof FormData
        ? Object.fromEntries(Array.from(error.config.data.entries()).map(([key, value]) => [
            key,
            value instanceof File 
              ? { name: value.name, type: value.type, size: value.size }
              : value
          ]))
        : error.config?.data
    };
    
    console.error("API Error:", errorDetails);
    return Promise.reject(error);
  }
);
