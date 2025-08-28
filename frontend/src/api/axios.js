// src/api/axios.js
import axios from "axios";

let logoutHandler = null; // 👈 will be set by AuthContext

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

// Create Axios instance
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor - add Authorization automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      console.warn("🔒 Unauthorized or Forbidden. Logging out...");
      if (logoutHandler) logoutHandler(); // 👈 auto logout user
    }
    return Promise.reject(error);
  }
);

export default api;
