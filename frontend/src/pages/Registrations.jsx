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
    const backendUrl = api.defaults.baseURL.replace('/api', '');

    // --- NEW STATE FOR THE MODAL ---
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

    // --- NEW HANDLER FUNCTIONS FOR MODAL AND DELETE ---
    const handleEditClick = (reg) => {
        setEditingRegistration(reg);
        setIsModalOpen(true);
    };

    const handleUpdateSave = async (updatedReg) => {
    try {
        await api.put(`/registrations/${updatedReg.id}`, updatedReg);
        setIsModalOpen(false);
        setEditingRegistration(null);
        
        // --- MORE ROBUST REFRESH LOGIC ---
        const currentPage = pagination?.meta?.current_page;
        
        // Safely refresh the current page, or default to the first page if pagination data is missing
        fetchRegistrations(currentPage ? `/registrations?page=${currentPage}` : '/registrations');

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
                
                // --- MORE ROBUST REFRESH LOGIC ---
                const currentPage = pagination?.meta?.current_page;
                const prevPageLink = pagination?.links?.prev;

                // Check if we just deleted the last item on a page (and it's not the first page)
                if (registrations.length === 1 && currentPage > 1) {
                    // Safely go to the previous page
                    fetchRegistrations(prevPageLink || `/registrations?page=${currentPage - 1}`);
                } else {
                    // Otherwise, refresh the current page, or default to page 1 if data is missing
                    fetchRegistrations(currentPage ? `/registrations?page=${currentPage}` : '/registrations');
                }
            }
        } catch (error) {
            alert("Failed to delete registration. See console for details.");
            console.error("Delete failed:", error.response || error);
        }
    }
};

    // ... (Your existing scanning functions: startScanning, stopScanning, etc. can remain here)

    if (loading) return <p>⏳ Loading registrations...</p>;
    if (error) return <p style={{ color: "red" }}>❌ {error}</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>📋 Registrations</h2>
            
            <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>Page {pagination?.meta?.current_page} of {pagination?.meta?.last_page}</span>
                <button onClick={() => fetchRegistrations(pagination.links.prev)} disabled={!pagination?.links?.prev || loading}>
                    &laquo; Previous
                </button>
                <button onClick={() => fetchRegistrations(pagination.links.next)} disabled={!pagination?.links?.next || loading}>
                    Next &raquo;
                </button>
                <span style={{ marginLeft: 'auto' }}>
                    Total Records: {pagination?.meta?.total}
                </span>
            </div>

            <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                            <td>{reg.first_name} {reg.last_name}</td>
                            <td>{reg.company_name || 'N/A'}</td>
                            <td>{reg.ticket_number}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                <button onClick={() => window.open(`${backendUrl}/api/registrations/${reg.ticket_number}/badge`, '_blank')}>
                                    Print Badge
                                </button>
                                                
                                {/* Only show Edit button if user has permission */}
                                {user.role?.permissions?.includes('edit-registration') && (
                                    <button onClick={() => handleEditClick(reg)} style={{ margin: '0 5px' }}>Edit</button>
                                )}
                            
                                {/* Only show Delete button if user has permission */}
                                {user.role?.permissions?.includes('delete-registration') && (
                                    <button onClick={() => handleDelete(reg.id)} style={{ color: 'red' }}>Delete</button>
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