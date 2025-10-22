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
      case 'complimentary': return '#28a745';
      default: return '#343a40';
    }
  };

  // ✅ Styles
  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1400px",
      margin: "0 auto",
      fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    },
    header: {
      marginBottom: "30px",
      paddingBottom: "15px",
      borderBottom: "3px solid #007bff"
    },
    section: {
      marginBottom: "30px",
      padding: "20px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      border: "1px solid #e9ecef"
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      marginBottom: "20px",
      color: "#333",
      borderBottom: "2px solid #f0f0f0",
      paddingBottom: "10px"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px"
    },
    card: {
      padding: "20px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      border: "1px solid #e9ecef",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default"
    },
    cardLabel: {
      fontSize: "13px",
      color: "#6c757d",
      marginBottom: "8px",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    cardValue: {
      fontSize: "32px",
      fontWeight: "bold",
      lineHeight: "1.2"
    },
    badge: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "600"
    },
    progressBar: {
      width: "100%",
      height: "8px",
      backgroundColor: "#e9ecef",
      borderRadius: "4px",
      overflow: "hidden",
      marginTop: "8px"
    },
    progressFill: (percentage, color) => ({
      width: `${percentage}%`,
      height: "100%",
      backgroundColor: color,
      transition: "width 0.3s ease"
    }),
    table: {
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
        <div style={{ fontSize: "18px", color: "#6c757d" }}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.container, textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
        <div style={{ fontSize: "18px", color: "#dc3545" }}>{error}</div>
      </div>
    );
  }

  if (!summary || !reportsCounts) {
    return (
      <div style={{ ...styles.container, textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>📊</div>
        <div style={{ fontSize: "18px", color: "#6c757d" }}>No data available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: "32px", color: "#333" }}>📊 ICEGEX 2025 Dashboard</h1>
        <p style={{ margin: "10px 0 0 0", color: "#6c757d", fontSize: "16px" }}>
          Real-time event registration overview and analytics
        </p>
      </div>

      {/* Overall Summary */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>📈 Overall Summary</h3>
        <div style={styles.grid}>
          <div style={{ ...styles.card, borderLeft: "4px solid #007bff" }}>
            <div style={styles.cardLabel}>👥 Total Registrations</div>
            <div style={{ ...styles.cardValue, color: "#007bff" }}>
              {reportsCounts.total || 0}
            </div>
          </div>
          <div style={{ ...styles.card, borderLeft: "4px solid #28a745" }}>
            <div style={styles.cardLabel}>✅ Confirmed</div>
            <div style={{ ...styles.cardValue, color: "#28a745" }}>
              {reportsCounts.confirmed || 0}
            </div>
            {reportsCounts.total > 0 && (
              <div style={styles.progressBar}>
                <div style={styles.progressFill(
                  Math.round((reportsCounts.confirmed / reportsCounts.total) * 100),
                  "#28a745"
                )}></div>
              </div>
            )}
          </div>
          <div style={{ ...styles.card, borderLeft: "4px solid #ffc107" }}>
            <div style={styles.cardLabel}>⏳ Unconfirmed</div>
            <div style={{ ...styles.cardValue, color: "#ffc107" }}>
              {reportsCounts.unconfirmed || 0}
            </div>
            {reportsCounts.total > 0 && (
              <div style={styles.progressBar}>
                <div style={styles.progressFill(
                  Math.round((reportsCounts.unconfirmed / reportsCounts.total) * 100),
                  "#ffc107"
                )}></div>
              </div>
            )}
          </div>
          <div style={{ ...styles.card, borderLeft: "4px solid #17a2b8" }}>
            <div style={styles.cardLabel}>🖥️ Server Mode</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#17a2b8", marginTop: "10px" }}>
              {summary.server_mode?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
        </div>
      </section>

      {/* Badge Status */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>🎫 Badge Print Status</h3>
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardLabel}>📄 Not Printed</div>
            <div style={{ ...styles.cardValue, color: "#6c757d" }}>
              {reportsCounts.badge_status?.not_printed || 0}
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>✅ Printed</div>
            <div style={{ ...styles.cardValue, color: "#28a745" }}>
              {reportsCounts.badge_status?.printed || 0}
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>🔄 Re-Printed</div>
            <div style={{ ...styles.cardValue, color: "#fd7e14" }}>
              {reportsCounts.badge_status?.reprinted || 0}
            </div>
          </div>
        </div>
      </section>

      {/* Payment Status */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>💰 Payment Status</h3>
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardLabel}>💵 Paid</div>
            <div style={{ ...styles.cardValue, color: "#28a745" }}>
              {reportsCounts.payment_status?.paid || 0}
            </div>
            {reportsCounts.total > 0 && (
              <div style={{ marginTop: "10px", fontSize: "14px", color: "#6c757d" }}>
                {Math.round((reportsCounts.payment_status?.paid / reportsCounts.total) * 100)}% of total
              </div>
            )}
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>❌ Unpaid</div>
            <div style={{ ...styles.cardValue, color: "#dc3545" }}>
              {reportsCounts.payment_status?.unpaid || 0}
            </div>
            {reportsCounts.total > 0 && (
              <div style={{ marginTop: "10px", fontSize: "14px", color: "#6c757d" }}>
                {Math.round((reportsCounts.payment_status?.unpaid / reportsCounts.total) * 100)}% of total
              </div>
            )}
          </div>
          <div style={styles.card}>
            <div style={styles.cardLabel}>🎁 Complimentary</div>
            <div style={{ ...styles.cardValue, color: "#17a2b8" }}>
              {reportsCounts.payment_status?.complimentary || 0}
            </div>
            {reportsCounts.total > 0 && (
              <div style={{ marginTop: "10px", fontSize: "14px", color: "#6c757d" }}>
                {Math.round((reportsCounts.payment_status?.complimentary / reportsCounts.total) * 100)}% of total
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Registration Type */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>📝 Registration Type Breakdown</h3>
        <div style={styles.grid}>
          <div style={{ ...styles.card, borderLeft: "4px solid #007bff" }}>
            <div style={styles.cardLabel}>🏢 Onsite</div>
            <div style={{ ...styles.cardValue, color: "#007bff" }}>
              {reportsCounts.registration_type?.onsite || 0}
            </div>
          </div>
          <div style={{ ...styles.card, borderLeft: "4px solid #17a2b8" }}>
            <div style={styles.cardLabel}>💻 Online</div>
            <div style={{ ...styles.cardValue, color: "#17a2b8" }}>
              {reportsCounts.registration_type?.online || 0}
            </div>
          </div>
          <div style={{ ...styles.card, borderLeft: "4px solid #6c757d" }}>
            <div style={styles.cardLabel}>📋 Pre-Registered</div>
            <div style={{ ...styles.cardValue, color: "#6c757d" }}>
              {reportsCounts.registration_type?.pre_registered || 0}
            </div>
          </div>
          <div style={{ ...styles.card, borderLeft: "4px solid #28a745" }}>
            <div style={styles.cardLabel}>🎁 Complimentary</div>
            <div style={{ ...styles.cardValue, color: "#28a745" }}>
              {reportsCounts.registration_type?.complimentary || 0}
            </div>
          </div>
        </div>
      </section>

      {/* Demographics Snapshot */}
      {reportsCounts.demographics?.total_with_demographics > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>👥 Demographics Snapshot</h3>
          <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#e7f3ff", borderRadius: "6px" }}>
            <div style={{ fontSize: "16px", color: "#0c5460" }}>
              📊 <strong>{reportsCounts.demographics.total_with_demographics}</strong> registrants 
              ({Math.round((reportsCounts.demographics.total_with_demographics / reportsCounts.total) * 100)}%) 
              provided demographic information
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Age Distribution */}
            {Object.keys(reportsCounts.demographics?.age_ranges || {}).length > 0 && (
              <div>
                <h4 style={{ fontSize: "16px", marginBottom: "15px", color: "#495057" }}>Age Distribution</h4>
                {Object.entries(reportsCounts.demographics.age_ranges)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([range, count]) => (
                    <div key={range} style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "14px", color: "#495057" }}>{range}</span>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#007bff" }}>{count}</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={styles.progressFill(
                          Math.round((count / reportsCounts.demographics.total_with_demographics) * 100),
                          "#007bff"
                        )}></div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Gender Distribution */}
            {Object.keys(reportsCounts.demographics?.gender || {}).length > 0 && (
              <div>
                <h4 style={{ fontSize: "16px", marginBottom: "15px", color: "#495057" }}>Gender Distribution</h4>
                {Object.entries(reportsCounts.demographics.gender)
                  .sort((a, b) => b[1] - a[1])
                  .map(([gender, count]) => (
                    <div key={gender} style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "14px", color: "#495057" }}>{gender}</span>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#6c757d" }}>{count}</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={styles.progressFill(
                          Math.round((count / reportsCounts.demographics.total_with_demographics) * 100),
                          "#6c757d"
                        )}></div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Survey Insights */}
      {reportsCounts.survey?.total_with_survey > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>📊 Survey Insights - ICEGEX 2025</h3>
          <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#d4edda", borderRadius: "6px" }}>
            <div style={{ fontSize: "16px", color: "#155724" }}>
              ✅ <strong>{reportsCounts.survey.total_with_survey}</strong> registrants 
              ({Math.round((reportsCounts.survey.total_with_survey / reportsCounts.total) * 100)}%) 
              completed survey questions
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Top Industries */}
            {Object.keys(reportsCounts.survey?.industry_sector || {}).length > 0 && (
              <div>
                <h4 style={{ fontSize: "16px", marginBottom: "15px", color: "#495057" }}>
                  🏭 Top 5 Industries
                </h4>
                {Object.entries(reportsCounts.survey.industry_sector)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([industry, count], index) => (
                    <div key={industry} style={{ 
                      marginBottom: "10px", 
                      padding: "10px", 
                      backgroundColor: index === 0 ? "#fff3cd" : "#f8f9fa", 
                      borderRadius: "6px",
                      borderLeft: index === 0 ? "3px solid #ffc107" : "3px solid #dee2e6"
                    }}>
                      <div style={{ fontSize: "13px", color: "#495057", marginBottom: "3px" }}>
                        {industry.length > 40 ? industry.substring(0, 40) + '...' : industry}
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>{count} responses</div>
                    </div>
                  ))}
              </div>
            )}

            {/* Top Marketing Channels */}
            {Object.keys(reportsCounts.survey?.how_did_you_learn || {}).length > 0 && (
              <div>
                <h4 style={{ fontSize: "16px", marginBottom: "15px", color: "#495057" }}>
                  📢 Top 5 Marketing Channels
                </h4>
                {Object.entries(reportsCounts.survey.how_did_you_learn)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([channel, count], index) => (
                    <div key={channel} style={{ 
                      marginBottom: "10px", 
                      padding: "10px", 
                      backgroundColor: index === 0 ? "#d1ecf1" : "#f8f9fa", 
                      borderRadius: "6px",
                      borderLeft: index === 0 ? "3px solid #17a2b8" : "3px solid #dee2e6"
                    }}>
                      <div style={{ fontSize: "13px", color: "#495057", marginBottom: "3px" }}>
                        {channel.length > 35 ? channel.substring(0, 35) + '...' : channel}
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#17a2b8" }}>{count} responses</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Scans per User */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>🔍 Staff Activity - Scans per User</h3>
        {summary.scans_per_user && summary.scans_per_user.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead style={{ backgroundColor: "#343a40", color: "#fff" }}>
                <tr>
                  <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Total Scans</th>
                </tr>
              </thead>
              <tbody>
                {summary.scans_per_user.map((user, index) => (
                  <tr 
                    key={user.id} 
                    style={{ 
                      borderBottom: "1px solid #dee2e6",
                      backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa"
                    }}
                  >
                    <td style={{ padding: "12px" }}>{user.id}</td>
                    <td style={{ padding: "12px", fontWeight: "500" }}>{user.name}</td>
                    <td style={{ padding: "12px", color: "#6c757d" }}>{user.email}</td>
                    <td style={{ 
                      padding: "12px", 
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "18px"
                    }}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: user.scans_count > 0 ? "#28a745" : "#e9ecef",
                        color: user.scans_count > 0 ? "#fff" : "#6c757d"
                      }}>
                        {user.scans_count || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            padding: "40px", 
            textAlign: "center", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "8px",
            color: "#6c757d"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>👥</div>
            <div>No user scan activity yet</div>
          </div>
        )}
      </section>
    </div>
  );
}