import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/dashboard/summary");
        setSummary(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <p>⏳ Loading dashboard...</p>;
  if (error) return <p style={{ color: "red" }}>❌ {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Dashboard</h2>

      {/* Registrations by Type */}
      <section>
        <h3>Registrations by Type</h3>
        <ul>
          {summary.registrations_by_type.map((item) => (
            <li key={item.registration_type}>
              {item.registration_type}: {item.total}
            </li>
          ))}
        </ul>
      </section>

      {/* Confirmed vs Pending */}
      <section>
        <h3>Confirmed vs Pending</h3>
        <ul>
          {summary.confirmed_vs_pending.map((item) => (
            <li key={item.confirmed}>
              {item.confirmed ? "Confirmed" : "Pending"}: {item.total}
            </li>
          ))}
        </ul>
      </section>

      {/* Scans per User */}
      <section>
        <h3>Scans per User</h3>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Scans</th>
            </tr>
          </thead>
          <tbody>
            {summary.scans_per_user.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.scans_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
