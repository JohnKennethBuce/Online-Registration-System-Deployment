import { useEffect, useState } from "react";
import api from "../api/axios";
import PermissionsModal from "../components/PermissionsModal";

export default function RoleManagementPage() {
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch both roles and all possible permissions
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/roles'),
                api.get('/permissions')
            ]);
            setRoles(rolesRes.data);
            setAllPermissions(permsRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleEditClick = (role) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleSavePermissions = async (roleId, permissions) => {
        try {
            await api.put(`/roles/${roleId}`, { permissions });
            setIsModalOpen(false);
            fetchData(); // Refresh all data
        } catch (error) {
            alert('Failed to save permissions.');
        }
    };
    
    if (loading) return <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#555" }}>Loading roles and permissions...</p>;
    if (error) return <p style={{ color: "red", textAlign: "center", fontSize: "1.2rem" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "20px", color: "#333" }}>🔑 Role & Permission Management</h2>
            
            <div style={{ overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8f9fa", color: "#333" }}>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Role Name</th>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Description</th>
                            <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role, index) => (
                            <tr
                                key={role.id}
                                style={{
                                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                                    transition: "background-color 0.3s",
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e2e6ea"}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa"}
                            >
                                <td style={{ padding: "12px", borderBottom: "1px solid #ddd", textTransform: 'capitalize' }}>{role.name}</td>
                                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{role.description}</td>
                                <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                                    <button
                                        onClick={() => handleEditClick(role)}
                                        style={{
                                            padding: "8px 12px",
                                            backgroundColor: "#ffc107",
                                            color: "#212529",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            transition: "background-color 0.3s",
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = "#e0a800"}
                                        onMouseOut={(e) => e.target.style.backgroundColor = "#ffc107"}
                                    >
                                        Edit Permissions
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <PermissionsModal
                    role={editingRole}
                    allPermissions={allPermissions}
                    onSave={handleSavePermissions}
                    onCancel={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}