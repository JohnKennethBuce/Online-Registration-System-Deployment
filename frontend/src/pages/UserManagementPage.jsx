import { useEffect, useState } from "react";
import api from "../api/axios";

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data.data); // Using .data because the response is paginated
        } catch (error) {
            alert('Failed to fetch users.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    
    const handleAddUser = async () => {
        const name = prompt("Enter new admin's name:");
        if (!name) return;

        const email = prompt("Enter new admin's email:");
        if (!email) return;

        const password = prompt("Enter new admin's password (min 8 chars):");
        if (!password || password.length < 8) {
            alert("Password must be at least 8 characters long.");
            return;
        }

        try {
            await api.post('/users', { name, email, password });
            fetchUsers(); // Refresh the list after adding
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create user.';
            alert(errorMsg);
            console.error(error.response.data);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
            try {
                await api.delete(`/users/${userId}`);
                fetchUsers(); // Refresh the list after deleting
            } catch (error) {
                alert('Failed to delete user.');
            }
        }
    };

    if (loading) return <p>Loading users...</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>👥 User Management</h2>
            <button onClick={handleAddUser} style={{ marginBottom: '20px' }}>Add New Admin</button>
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
                                <button onClick={() => handleDeleteUser(user.id)} style={{ color: 'red' }}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}