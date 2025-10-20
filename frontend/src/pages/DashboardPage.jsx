import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [reportsCounts, setReportsCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ✅ Fetch both summary and reports counts
        const [summaryRes, countsRes] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/dashboard/reports-counts")
        ]);
        
        console.log("Dashboard summary:", summaryRes.data);
        console.log("Reports counts:", countsRes.data);
        
        setSummary(summaryRes.data);
        setReportsCounts(countsRes.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // ✅ Format registration type for display
  const formatRegistrationType = (type) => {
    if (!type) return 'Unknown';
    // Convert pre-registered to Pre-Registered, onsite to Onsite, online to Online
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('-');
  };

  // ✅ Get color for registration type
  const getTypeColor = (type) => {
    switch (type) {
      case 'onsite': return '#007bff';
      case 'online': return '#17a2b8';
      case 'pre-registered': return '#6c757d';
      default: return '#343a40';
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>⏳ Loading dashboard...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>❌ {error}</div>;
  if (!summary) return <div style={{ padding: "20px" }}>No data available</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Dashboard</h2>

      {/* Reports Counts Section - Including Not Printed */}
      {reportsCounts && (
        <section style={{ 
          marginBottom: "30px", 
          padding: "15px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "8px",
          border: "1px solid #dee2e6"
        }}>
          <h3 style={{ marginBottom: "15px" }}>📈 Registration Reports</h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "15px" 
          }}>
            <div style={{ padding: "15px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>📄 Not Printed</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#6c757d" }}>{reportsCounts.not_printed || 0}</div>
            </div>
            <div style={{ padding: "15px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>✅ Printed Badges</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#28a745" }}>{reportsCounts.printed}</div>
            </div>
            <div style={{ padding: "15px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>🔄 Reprinted Badges</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ffc107" }}>{reportsCounts.reprinted}</div>
            </div>
            <div style={{ padding: "15px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>💰 Paid</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#17a2b8" }}>{reportsCounts.paid}</div>
            </div>
            <div style={{ padding: "15px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>❌ Unpaid</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc3545" }}>{reportsCounts.unpaid}</div>
            </div>
            <div style={{ padding: "15px", backgroundColor: "#fff", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "5px" }}>👥 Total Registrants</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#007bff" }}>{reportsCounts.total}</div>
            </div>
          </div>
        </section>
      )}

      {/* Server Mode */}
      <section style={{ marginBottom: "20px" }}>
        <h3>🖥️ Server Mode</h3>
        <p style={{ 
          fontSize: "18px", 
          padding: "10px 15px", 
          backgroundColor: "#e7f3ff", 
          borderRadius: "5px",
          display: "inline-block"
        }}>
          <strong>{summary.server_mode || 'Unknown'}</strong>
        </p>
      </section>

      {/* Registrations by Type - Updated to handle Pre-Registered */}
      <section style={{ marginBottom: "20px" }}>
        <h3>📝 Registrations by Type</h3>
        {summary.registrations_by_type && summary.registrations_by_type.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {summary.registrations_by_type.map((item, index) => (
              <li key={index} style={{ 
                padding: "10px", 
                marginBottom: "8px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "5px",
                borderLeft: `4px solid ${getTypeColor(item.registration_type)}`
              }}>
                <span>{formatRegistrationType(item.registration_type)}</span>: <strong>{item.total}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>No registrations yet</p>
        )}
      </section>

      {/* Confirmed vs Pending */}
      <section style={{ marginBottom: "20px" }}>
        <h3>✅ Confirmed vs Pending</h3>
        {summary.confirmed_vs_pending && summary.confirmed_vs_pending.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {summary.confirmed_vs_pending.map((item, index) => (
              <li key={index} style={{ 
                padding: "10px", 
                marginBottom: "8px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "5px",
                borderLeft: item.confirmed ? "4px solid #28a745" : "4px solid #ffc107"
              }}>
                {item.confirmed ? "✅ Confirmed" : "⏳ Pending"}: <strong>{item.total}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>No data</p>
        )}
      </section>

      {/* Scans per User */}
      <section style={{ marginBottom: "20px" }}>
        <h3>🔍 Scans per User</h3>
        {summary.scans_per_user && summary.scans_per_user.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="10" style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <thead style={{ backgroundColor: "#007bff", color: "#fff" }}>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Scans</th>
                </tr>
              </thead>
              <tbody>
                {summary.scans_per_user.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                    <td style={{ textAlign: "center" }}>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td style={{ 
                      textAlign: "center", 
                      fontWeight: "bold",
                      color: user.scans_count > 0 ? "#28a745" : "#6c757d"
                    }}>
                      {user.scans_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No users found</p>
        )}
      </section>
    </div>
  );
}