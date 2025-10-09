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
            await api.post('/users', newUser);
            setIsAddModalOpen(false);
            fetchData();
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

    if (loading) return <p>Loading users...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>👥 User Management</h2>
            <button onClick={handleAddClick} style={{ marginBottom: '20px' }}>Add New User</button>
            
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '8px' }}>ID</th>
                        <th style={{ padding: '8px' }}>Name</th>
                        <th style={{ padding: '8px' }}>Email</th>
                        <th style={{ padding: '8px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td style={{ padding: '8px' }}>{user.id}</td>
                            <td style={{ padding: '8px' }}>{user.name}</td>
                            <td style={{ padding: '8px' }}>{user.email}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                <button onClick={() => handleEditClick(user)} style={{ marginRight: '5px' }}>Edit</button>
                                <button onClick={() => handleDeleteUser(user.id)} style={{ color: 'red' }}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
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