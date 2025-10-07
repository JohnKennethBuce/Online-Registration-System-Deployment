import { useEffect, useState } from "react";
import api from "../api/axios";

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.data); // Assuming paginated response
        } catch (error) {
            alert('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    
    const handleAddUser = async () => {
        const name = prompt("Enter new admin's name:");
        const email = prompt("Enter new admin's email:");
        const password = prompt("Enter new admin's password (min 8 chars):");

        if (name && email && password) {
            try {
                await api.post('/users', { name, email, password });
                fetchUsers(); // Refresh the list
            } catch (error) {
                alert('Failed to create user. Check console for details.');
                console.error(error.response.data);
            }
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            try {
                await api.delete(`/users/${userId}`);
                fetchUsers(); // Refresh the list
            } catch (error) {
                alert('Failed to delete user.');
            }
        }
    };

    if (loading) return <p>Loading users...</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>User Management</h2>
            <button onClick={handleAddUser}>Add New Admin</button>
            <table border="1" style={{ width: '100%', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}