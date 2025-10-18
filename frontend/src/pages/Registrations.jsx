import { useEffect, useState } from "react";
import api from "../api/axios";
import Modal from "../components/Modal";
import EditRegistrationForm from "../components/EditRegistrationForm";
import { useAuth } from "../context/AuthContext";

export default function Registrations() {
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);

  const backendBase = api.defaults.baseURL;

  // 🔐 --- Authorization Check ---
  const isAuthorized =
    user &&
    ["admin", "superadmin"].includes(user.role?.name) &&
    user.role?.permissions?.includes("view-registrations");

  // --- Fetch registrations ---
  const fetchRegistrations = async (url = "/registrations") => {
    setLoading(true);
    try {
      const res = await api.get(url);
      setRegistrations(res.data.data);
      setPagination({ links: res.data.links, meta: res.data.meta });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchRegistrations();
  }, [isAuthorized]);

  const handleEditClick = (reg) => {
    setEditingRegistration(reg);
    setIsModalOpen(true);
  };

  const handleUpdateSave = async (updatedReg) => {
    try {
      await api.put(`/registrations/${updatedReg.id}`, updatedReg);
      setIsModalOpen(false);
      setEditingRegistration(null);
      const currentPage = pagination?.meta?.current_page;
      fetchRegistrations(currentPage ? `/registrations?page=${currentPage}` : "/registrations");
    } catch (error) {
      alert("Failed to update registration. See console for details.");
      console.error("Update failed:", error.response || error);
    }
  };

  const handleDelete = async (regId) => {
    if (window.confirm("Are you sure you want to delete this registration permanently?")) {
      try {
        const response = await api.delete(`/registrations/${regId}`);
        if (response.status === 204) {
          alert("Registration deleted successfully.");
          const currentPage = pagination?.meta?.current_page;
          const prevPageLink = pagination?.links?.prev;
          if (registrations.length === 1 && currentPage > 1) {
            fetchRegistrations(prevPageLink || `/registrations?page=${currentPage - 1}`);
          } else {
            fetchRegistrations(currentPage ? `/registrations?page=${currentPage}` : "/registrations");
          }
        }
      } catch (error) {
        alert("Failed to delete registration. See console for details.");
        console.error("Delete failed:", error.response || error);
      }
    }
  };

  const handlePrintBadge = async (reg) => {
    setError("");
    const ticket = reg.ticket_number;
    const printWin = window.open("", "_blank");
    setPrintingId(reg.id);

    try {
      await api.post(`/registrations/${ticket}/scan`);
      const badgeUrl = `/print-badge/${ticket}`;
      if (printWin) {
        printWin.location = badgeUrl;
        printWin.focus();
      } else {
        window.open(badgeUrl, "_blank");
      }
      const currentPage = pagination?.meta?.current_page;
      fetchRegistrations(currentPage ? `/registrations?page=${currentPage}` : "/registrations");
    } catch (err) {
      if (printWin) {
        try { printWin.close(); } catch (_) {}
      }
      const code = err.response?.status;
      const msg =
        code === 404
          ? "Ticket not found."
          : code === 403
          ? "Scan not allowed in current mode or permission denied."
          : code === 409
          ? "Reprint limit reached for this badge."
          : err.response?.data?.error || err.response?.data?.message || "Scan/print failed.";
      setError(msg);

      if (code && code !== 401) {
        const proceed = window.confirm(`${msg}\nOpen badge page anyway?`);
        if (proceed) {
          const badgeUrl = `${backendBase}/registrations/${ticket}/badge?show_qr=false&print=true`;
          window.open(badgeUrl, "_blank");
        }
      }
    } finally {
      setPrintingId(null);
    }
  };

  // --- UI Rendering ---
  if (authLoading) return <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#555" }}>⏳ Checking authorization...</p>;
  if (!user) return <p style={{ color: "red", padding: "20px", textAlign: "center", fontSize: "1.2rem" }}>🔒 You must be logged in to view this page.</p>;
  if (!isAuthorized)
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center", fontSize: "1.2rem" }}>
        ❌ Access Denied. You do not have permission to view registrations.
      </div>
    );

  if (loading) return <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#555" }}>⏳ Loading registrations...</p>;
  if (error) return <p style={{ color: "red", textAlign: "center", fontSize: "1.2rem" }}>❌ {error}</p>;

  // REMOVED: The getPrintingStatus function is no longer needed.

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "10px", color: "#333" }}>📋 Registrations</h2>

      {/* Legend is a static visual guide */}
      <div style={{
        padding: "10px 15px", backgroundColor: "#f8f9fa", borderRadius: "8px", marginBottom: "20px",
        display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", border: "1px solid #ddd"
      }}>
        <h4 style={{ margin: 0, marginRight: "10px", fontSize: "1rem" }}>Legend:</h4>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "15px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#28a745", borderRadius: "3px" }}></span> Paid
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#dc3545", borderRadius: "3px" }}></span> Unpaid
          </span>
          <span style={{ fontWeight: "bold", color: "#6c757d" }}>Not Printed</span>
          <span style={{ fontWeight: "bold", color: "#28a745" }}>Printed</span>
          <span style={{ fontWeight: "bold", color: "#fd7e14" }}>Re-Printed</span>
        </div>
      </div>

      {/* Pagination controls... */}

      <div style={{ overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          {/* Table head remains the same */}
          <thead>...</thead>
          <tbody>
            {registrations.map((reg, index) => (
                <tr
                  key={reg.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                    transition: "background-color 0.3s",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e2e6ea"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa"}
                >
                  <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{reg.id}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
                    {reg.first_name} {reg.last_name}
                  </td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{reg.company_name || "N/A"}</td>
                  <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{reg.ticket_number}</td>
                  <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                    <span
                      style={{
                        padding: "6px 12px", borderRadius: "20px", color: "white",
                        backgroundColor: reg.payment_status === "paid" ? "#28a745" : "#dc3545",
                        fontSize: "0.9rem", fontWeight: "bold",
                      }}
                    >
                      {reg.payment_status?.toUpperCase() || "UNPAID"}
                    </span>
                  </td>
                  
                  {/* MODIFIED: Using the object from the backend */}
                  <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                    <span
                      style={{
                        color: reg.badge_status_display?.color || '#6c757d', // Use color from backend
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        textTransform: 'uppercase'
                      }}
                    >
                      {reg.badge_status_display?.text || 'UNKNOWN'}
                    </span>
                  </td>

                  <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                    {/* MODIFIED: Using the real status name for the button text */}
                    <button
                      onClick={() => handlePrintBadge(reg)}
                      disabled={printingId === reg.id}
                      style={{
                        padding: "8px 12px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer",
                        opacity: printingId === reg.id ? 0.5 : 1, transition: "background-color 0.3s",
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = "#138496"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "#17a2b8"}
                    >
                      {printingId === reg.id 
                        ? "Printing…" 
                        : (reg.badge_status?.name && reg.badge_status.name !== 'not_printed' ? "Re-Print Badge" : "Print Badge")
                      }
                    </button>

                    {user.role?.permissions?.includes("edit-registration") && (
                      <button
                        onClick={() => handleEditClick(reg)}
                        style={{
                          padding: "8px 12px", backgroundColor: "#ffc107", color: "#212529", border: "none", borderRadius: "4px", cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = "#e0a800"}
                        onMouseOut={(e) => e.target.style.backgroundColor = "#ffc107"}
                      >
                        Edit
                      </button>
                    )}

                    {user.role?.permissions?.includes("delete-registration") && (
                      <button
                        onClick={() => handleDelete(reg.id)}
                        style={{
                          padding: "8px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
                        onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Registration">
        {editingRegistration && (
          <EditRegistrationForm
            registration={editingRegistration}
            onSave={handleUpdateSave}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}