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
  const [togglingPaymentId, setTogglingPaymentId] = useState(null); // ✅ NEW: Track which payment is being toggled

  const backendBase = api.defaults.baseURL;

  // 🔐 --- Authorization Check ---
  const isAuthorized =
    user &&
    ["admin", "superadmin"].includes(user.role?.name) &&
    user.role?.permissions?.includes("view-registrations");

  // ✅ Check if user can edit registrations (for payment toggle)
  const canEdit = user?.role?.permissions?.includes("edit-registration");

  // ✅ Format registration type for display
  const formatRegistrationType = (type) => {
    if (!type) return 'N/A';
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

  // ✅ NEW: Handle payment status toggle
  const handleTogglePayment = async (registration) => {
    if (!canEdit) {
      alert("You don't have permission to change payment status.");
      return;
    }

    const confirmMsg = registration.payment_status === 'paid' 
      ? `Mark this registration as UNPAID?\n\nName: ${registration.first_name} ${registration.last_name}\nCompany: ${registration.company_name || 'N/A'}`
      : `Mark this registration as PAID?\n\nName: ${registration.first_name} ${registration.last_name}\nCompany: ${registration.company_name || 'N/A'}`;

    if (!window.confirm(confirmMsg)) return;

    setTogglingPaymentId(registration.id);
    setError(null);

    try {
      const response = await api.put(`/registrations/${registration.id}/toggle-payment`);
      
      // Update the registration in the local state with the returned data
      setRegistrations(prevRegs => 
        prevRegs.map(reg => 
          reg.id === registration.id ? response.data : reg
        )
      );

      // Show success feedback
      const newStatus = response.data.payment_status;
      alert(`Payment status updated to ${newStatus.toUpperCase()}`);

    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to update payment status";
      setError(errorMsg);
      alert(errorMsg);
      console.error("Payment toggle failed:", err.response || err);
    } finally {
      setTogglingPaymentId(null);
    }
  };

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

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "10px", color: "#333" }}>📋 Registrations</h2>

      {/* Updated Legend with Registration Types */}
      <div style={{
        padding: "10px 15px", backgroundColor: "#f8f9fa", borderRadius: "8px", marginBottom: "20px",
        display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", border: "1px solid #ddd"
      }}>
        <h4 style={{ margin: 0, marginRight: "10px", fontSize: "1rem" }}>Legend:</h4>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "15px" }}>
          {/* Registration Types */}
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#007bff", borderRadius: "3px" }}></span> Onsite
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#17a2b8", borderRadius: "3px" }}></span> Online
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#6c757d", borderRadius: "3px" }}></span> Pre-Registered
          </span>
          <span style={{ margin: "0 10px", color: "#ddd" }}>|</span>
          {/* Payment Status */}
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#28a745", borderRadius: "3px" }}></span> Paid
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#dc3545", borderRadius: "3px" }}></span> Unpaid
          </span>
          {canEdit && (
            <span style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#666" }}>
              (Click payment badge to toggle)
            </span>
          )}
          <span style={{ margin: "0 10px", color: "#ddd" }}>|</span>
          {/* Badge Status */}
          <span style={{ fontWeight: "bold", color: "#6c757d" }}>Not Printed</span>
          <span style={{ fontWeight: "bold", color: "#28a745" }}>Printed</span>
          <span style={{ fontWeight: "bold", color: "#fd7e14" }}>Re-Printed</span>
        </div>
      </div>

      {/* Pagination controls */}
      {pagination && pagination.meta && (
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            Showing {pagination.meta.from || 0} to {pagination.meta.to || 0} of {pagination.meta.total || 0} registrations
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            {pagination.links?.prev && (
              <button
                onClick={() => fetchRegistrations(pagination.links.prev)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Previous
              </button>
            )}
            {pagination.links?.next && (
              <button
                onClick={() => fetchRegistrations(pagination.links.next)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          {/* Updated Table Headers */}
          <thead>
            <tr style={{ backgroundColor: "#343a40", color: "white" }}>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>ID</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Company</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Ticket</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Type</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Payment</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Badge Status</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length > 0 ? (
              registrations.map((reg, index) => (
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
                  <td style={{ padding: "12px", borderBottom: "1px solid #ddd", fontSize: "0.85rem" }}>{reg.ticket_number}</td>
                  
                  {/* ✅ Registration Type */}
                  <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                    <span
                      style={{
                        padding: "6px 12px", 
                        borderRadius: "20px", 
                        color: "white",
                        backgroundColor: getTypeColor(reg.registration_type),
                        fontSize: "0.85rem", 
                        fontWeight: "bold",
                      }}
                    >
                      {formatRegistrationType(reg.registration_type)}
                    </span>
                  </td>

                  {/* ✅ UPDATED: Payment Status - Now clickable if user has edit permission */}
                  <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                    <span
                      onClick={() => canEdit && handleTogglePayment(reg)}
                      style={{
                        padding: "6px 12px", 
                        borderRadius: "20px", 
                        color: "white",
                        backgroundColor: reg.payment_status === "paid" ? "#28a745" : "#dc3545",
                        fontSize: "0.9rem", 
                        fontWeight: "bold",
                        cursor: canEdit ? "pointer" : "default",
                        opacity: togglingPaymentId === reg.id ? 0.6 : 1,
                        transition: "all 0.3s",
                        display: "inline-block",
                        userSelect: "none",
                        border: canEdit ? "2px solid transparent" : "none",
                      }}
                      onMouseOver={(e) => {
                        if (canEdit && togglingPaymentId !== reg.id) {
                          e.target.style.border = "2px solid #fff";
                          e.target.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (canEdit) {
                          e.target.style.border = "2px solid transparent";
                          e.target.style.transform = "scale(1)";
                        }
                      }}
                      title={canEdit ? `Click to toggle payment status` : reg.payment_status?.toUpperCase() || "UNPAID"}
                    >
                      {togglingPaymentId === reg.id 
                        ? "..." 
                        : (reg.payment_status?.toUpperCase() || "UNPAID")
                      }
                    </span>
                  </td>
                  
                  {/* Badge Status */}
                  <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                    <span
                      style={{
                        color: reg.badge_status_display?.color || '#6c757d',
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        textTransform: 'uppercase'
                      }}
                    >
                      {reg.badge_status_display?.text || 'UNKNOWN'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => handlePrintBadge(reg)}
                        disabled={printingId === reg.id}
                        style={{
                          padding: "8px 12px", 
                          backgroundColor: "#17a2b8", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "4px", 
                          cursor: "pointer",
                          opacity: printingId === reg.id ? 0.5 : 1, 
                          transition: "background-color 0.3s",
                          fontSize: "0.85rem"
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
                            padding: "8px 12px", 
                            backgroundColor: "#ffc107", 
                            color: "#212529", 
                            border: "none", 
                            borderRadius: "4px", 
                            cursor: "pointer",
                            transition: "background-color 0.3s",
                            fontSize: "0.85rem"
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
                            padding: "8px 12px", 
                            backgroundColor: "#dc3545", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "4px", 
                            cursor: "pointer",
                            transition: "background-color 0.3s",
                            fontSize: "0.85rem"
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
                          onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>
                  No registrations found
                </td>
              </tr>
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