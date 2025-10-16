import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import jsQR from "jsqr";
import Modal from "../components/Modal";
import EditRegistrationForm from "../components/EditRegistrationForm";
import { useAuth } from "../context/AuthContext";

export default function Registrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const backendUrl = api.defaults.baseURL.replace("/api", "");
  const backendBase = api.defaults.baseURL; // e.g. http://127.0.0.1:8000/api
  const [printingId, setPrintingId] = useState(null);

  // --- Modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);

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
    fetchRegistrations();
  }, []);

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

  // Print like the scanner: update statuses (scan) then open badge, then refresh
  const handlePrintBadge = async (reg) => {
    setError("");
    const ticket = reg.ticket_number;

    // Open a blank tab first to avoid popup blockers
    const printWin = window.open("", "_blank");
    setPrintingId(reg.id);

    try {
      // 1) Update statuses + create scan log (printed / one-time reprinted; superadmin unlimited)
      await api.post(`/registrations/${ticket}/scan`);

      // 2) Navigate the opened tab to the React badge print page
      const badgeUrl = `/print-badge/${ticket}`;
      if (printWin) {
        printWin.location = badgeUrl;
        printWin.focus();
      } else {
        window.open(badgeUrl, "_blank");
      }

      // 3) Refresh the current table page to reflect updated statuses
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

      // Optional: allow printing anyway (manual override)
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

  // ... (Your camera scanning functions can remain here if you use them)

  if (loading) return <p>⏳ Loading registrations...</p>;
  if (error) return <p style={{ color: "red" }}>❌ {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 Registrations</h2>

      <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
        <span>
          Page {pagination?.meta?.current_page} of {pagination?.meta?.last_page}
        </span>
        <button onClick={() => fetchRegistrations(pagination.links.prev)} disabled={!pagination?.links?.prev || loading}>
          « Previous
        </button>
        <button onClick={() => fetchRegistrations(pagination.links.next)} disabled={!pagination?.links?.next || loading}>
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

                {/* Only show Edit button if user has permission */}
                {user.role?.permissions?.includes("edit-registration") && (
                  <button onClick={() => handleEditClick(reg)} style={{ margin: "0 5px" }}>
                    Edit
                  </button>
                )}

                {/* Only show Delete button if user has permission */}
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

      {/* --- The Modal for Editing --- */}
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