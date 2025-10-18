import { useEffect, useState } from "react";
import api from "../api/axios";
import Modal from "../components/Modal";
import EditUserForm from "../components/EditUserForm";
import AddUserForm from "../components/AddUserForm";

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles'),
            ]);
            setUsers(usersRes.data.data);
            setRoles(rolesRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch page data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    // --- Edit Handlers ---
    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleUpdateSave = async (updatedUser) => {
        try {
            await api.put(`/users/${updatedUser.id}`, updatedUser);
            setIsEditModalOpen(false);
            fetchData();
        } catch (err) {
            alert('Failed to update user.');
            console.error(err.response?.data);
        }
    };

    // --- Add Handlers ---
    const handleAddClick = () => {
        setIsAddModalOpen(true);
    };

    const handleCreateSave = async (newUser) => {
    try {
        const res = await api.post('/users', newUser);

        const { user, token } = res.data;

        console.log('✅ New user created:', user);
        console.log('🔑 Auto-generated token:', token);

        // 🪄 Auto-login as the new user (optional but powerful)
        console.log(`New ${user.role.name} token:`, token);

        setIsAddModalOpen(false);
        fetchData();

        alert(`${user.name} created successfully and is now authenticated!`);
    } catch (err) {
        alert('Failed to create user. Check console for details.');
        console.error(err.response?.data);
    }
};

    // --- Delete Handler ---
    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            try {
                await api.delete(`/users/${userId}`);
                fetchData();
            } catch (err) {
                alert('Failed to delete user.');
            }
        }
    };

    if (loading) return <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#555" }}>Loading users...</p>;
    if (error) return <p style={{ color: "red", textAlign: "center", fontSize: "1.2rem" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "20px", color: "#333" }}>👥 User Management</h2>
            <button
                onClick={handleAddClick}
                style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginBottom: "20px",
                    transition: "background-color 0.3s",
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#218838"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}
            >
                Add New User
            </button>
            
            <div style={{ overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8f9fa", color: "#333" }}>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>ID</th>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Name</th>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Email</th>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Role</th>
                            <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr
                                key={user.id}
                                style={{
                                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                                    transition: "background-color 0.3s",
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e2e6ea"}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa"}
                            >
                                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{user.id}</td>
                                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{user.name}</td>
                                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{user.email}</td>
                                <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{user.role?.name || 'N/A'}</td>
                                <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => handleEditClick(user)}
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
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        style={{
                                            padding: "8px 12px",
                                            backgroundColor: "#dc3545",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            transition: "background-color 0.3s",
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
                                        onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Admin User">
                {editingUser && (
                    <EditUserForm
                        user={editingUser}
                        onSave={handleUpdateSave}
                        onCancel={() => setIsEditModalOpen(false)}
                    />
                )}
            </Modal>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New User">
                <AddUserForm
                    roles={roles}
                    onSave={handleCreateSave}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    );
}