import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import jsQR from "jsqr";

export default function Registrations() {
    const [registrations, setRegistrations] = useState([]);
    const [pagination, setPagination] = useState(null); // <-- NEW: State for pagination info
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const backendUrl = api.defaults.baseURL;

    // UPDATED: fetchRegistrations now accepts a URL for pagination
    const fetchRegistrations = async (url = "/registrations") => {
        setLoading(true);
        try {
            const res = await api.get(url);
            setRegistrations(res.data.data); // <-- Data is now in the .data property
            setPagination({ // <-- Store pagination links and metadata
                links: res.data.links,
                meta: res.data.meta,
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load registrations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations(); // Fetch the first page on component mount
    }, []);

    // ... (Your existing scanning and printing functions: startScanning, stopScanning, tick, handleScan, etc. remain the same)

    if (loading) return <p>⏳ Loading registrations...</p>;
    if (error) return <p style={{ color: "red" }}>❌ {error}</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>📋 Registrations</h2>
            {/* ... your scanner buttons ... */}

            {/* NEW: Pagination Controls */}
            <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>
                    Page {pagination?.meta?.current_page} of {pagination?.meta?.last_page}
                </span>
                <button
                    onClick={() => fetchRegistrations(pagination.links.prev)}
                    disabled={!pagination?.links?.prev || loading}
                >
                    &laquo; Previous
                </button>
                <button
                    onClick={() => fetchRegistrations(pagination.links.next)}
                    disabled={!pagination?.links?.next || loading}
                >
                    Next &raquo;
                </button>
                <span style={{ marginLeft: 'auto' }}>
                    Total Records: {pagination?.meta?.total}
                </span>
            </div>

            <table border="1" cellPadding="6">
                {/* ... (Your table head remains the same) ... */}
                <tbody>
                {registrations.map((reg) => {
                        const imageUrl = `${backendUrl}/storage/${reg.qr_code_path}`;
                        return (
                            <tr key={reg.id}>
                                <td>{reg.id}</td>
                                {/* ... other cells like name, email, etc. ... */}
                        
                                {/* TO: Replace the old buttons with this new, single button */}
                                <td>
                                    <button onClick={() => window.open(`${api.defaults.baseURL}/registrations/${reg.ticket_number}/badge`, '_blank')}>
                                        View/Print Badge
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}