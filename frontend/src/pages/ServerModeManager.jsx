import { useState, useEffect } from "react";
import api from "../api/axios";

export default function ServerModeManager() {
  const [currentMode, setCurrentMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCurrentMode = async () => {
    setLoading(true);
    try {
      const res = await api.get("/server-mode");
      setCurrentMode(res.data.current_mode);
    } catch (err) {
      setError("Failed to fetch server mode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentMode();
  }, []);

  const handleSetMode = async (mode) => {
    setIsUpdating(true);
    try {
      await api.post("/server-mode", { mode });
      // Refetch the mode to show the update
      await fetchCurrentMode(); 
    } catch (err) {
      alert(`Failed to set mode: ${err.response?.data?.message || 'Error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <p>Loading server status...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>⚙️ Server Mode Management</h2>
      <p>
        Current Active Mode:{" "}
        <strong style={{ textTransform: "uppercase", color: "green" }}>
          {currentMode?.mode}
        </strong>
      </p>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => handleSetMode("onsite")} disabled={isUpdating}>
          Activate Onsite
        </button>
        <button onClick={() => handleSetMode("online")} disabled={isUpdating}>
          Activate Online
        </button>
        <button onClick={() => handleSetMode("both")} disabled={isUpdating}>
          Activate Both
        </button>
        <button onClick={() => handleSetMode("deactivate")} disabled={isUpdating}>
          Deactivate All
        </button>
      </div>
      <p style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
        Last updated by: {currentMode?.activated_by?.name} on {new Date(currentMode?.created_at).toLocaleString()}
      </p>
    </div>
  );
}