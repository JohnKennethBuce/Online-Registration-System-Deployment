import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import jsQR from "jsqr";
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
        try {
          printWin.close();
        } catch (_) {}
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
  if (authLoading) return <p>⏳ Checking authorization...</p>;
  if (!user) return <p style={{ color: "red", padding: "20px" }}>🔒 You must be logged in to view this page.</p>;
  if (!isAuthorized)
    return (
      <div style={{ padding: "20px", color: "red" }}>
        ❌ Access Denied. You do not have permission to view registrations.
      </div>
    );

  if (loading) return <p>⏳ Loading registrations...</p>;
  if (error) return <p style={{ color: "red" }}>❌ {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 Registrations</h2>

      <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
        <span>
          Page {pagination?.meta?.current_page} of {pagination?.meta?.last_page}
        </span>
        <button
          onClick={() => fetchRegistrations(pagination.links.prev)}
          disabled={!pagination?.links?.prev || loading}
        >
          « Previous
        </button>
        <button
          onClick={() => fetchRegistrations(pagination.links.next)}
          disabled={!pagination?.links?.next || loading}
        >
          Next »
        </button>
        <span style={{ marginLeft: "auto" }}>Total Records: {pagination?.meta?.total}</span>
      </div>

      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Company</th>
            <th>Ticket Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => (
            <tr key={reg.id}>
              <td>{reg.id}</td>
              <td>
                {reg.first_name} {reg.last_name}
              </td>
              <td>{reg.company_name || "N/A"}</td>
              <td>{reg.ticket_number}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>
                <button onClick={() => handlePrintBadge(reg)} disabled={printingId === reg.id}>
                  {printingId === reg.id ? "Printing…" : "Print Badge"}
                </button>

                {user.role?.permissions?.includes("edit-registration") && (
                  <button onClick={() => handleEditClick(reg)} style={{ margin: "0 5px" }}>
                    Edit
                  </button>
                )}

                {user.role?.permissions?.includes("delete-registration") && (
                  <button onClick={() => handleDelete(reg.id)} style={{ color: "red" }}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
