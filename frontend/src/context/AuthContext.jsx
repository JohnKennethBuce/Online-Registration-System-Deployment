import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { setLogoutHandler } from "../api/axios"; // 👈 import setLogoutHandler

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(
    localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null
  );
  const [loading, setLoading] = useState(true);

  // 🔹 Sync Axios global logout with our logout method
  const logout = useCallback(async () => {
    if (token) {
      try {
        await api.post("/auth/logout"); // no need for manual headers, Axios adds it
      } catch (err) {
        console.error("Logout error:", err);
      }
    }

    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, [token]);

  useEffect(() => {
    setLogoutHandler(logout); // 👈 register logout handler
  }, [logout]);

  // 🔹 Fetch user profile
  const fetchUser = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get("/me"); // headers auto-attached
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch (err) {
      console.error("Fetch user error:", err);
      logout();
    }
  }, [token, logout]);

  // 🔹 Restore user on mount
  useEffect(() => {
    const init = async () => {
      if (token && !user) {
        await fetchUser();
      }
      setLoading(false);
    };
    init();
  }, [token, user, fetchUser]);

  // 🔹 Login
  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return true;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, fetchUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
