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
    
    if (loading) return <p>Loading roles and permissions...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>🔑 Role & Permission Management</h2>
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '8px' }}>Role Name</th>
                        <th style={{ padding: '8px' }}>Description</th>
                        <th style={{ padding: '8px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map(role => (
                        <tr key={role.id}>
                            <td style={{ padding: '8px', textTransform: 'capitalize' }}>{role.name}</td>
                            <td style={{ padding: '8px' }}>{role.description}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                <button onClick={() => handleEditClick(role)}>Edit Permissions</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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