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
    if (error.response?.status === 401) {
    console.warn("🔒 Unauthorized. Logging out...");
    if (logoutHandler) logoutHandler();}   

    else if (error.response?.status === 403) {
     console.warn("⛔ Forbidden. You don't have permission for this action.");}
     // Let the caller handle it (e.g., show Unauthorized page or message)
    return Promise.reject(error);
  }
);

export default api;