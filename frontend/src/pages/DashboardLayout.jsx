import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// This is the new navigation bar for inside the dashboard
function DashboardNav() {
  const { user } = useAuth();
  const linkStyle = { marginRight: '15px', textDecoration: 'none' };

  return (
    <nav style={{ background: '#f4f4f4', padding: '10px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
      <Link to="/dashboard" style={linkStyle}>Summary</Link>

      {user.role?.permissions?.includes('view-registrations') && (
        <Link to="/dashboard/registrations" style={linkStyle}>Registrations</Link>
      )}

      {user.role?.permissions?.includes('create-registration') && (
        <Link to="/dashboard/register-new" style={linkStyle}>New Registration</Link>
      )}

      {user.role?.permissions?.includes('view-users') && (
        <Link to="/dashboard/user-management" style={linkStyle}>User Management</Link>
      )}

      {user.role?.permissions?.includes('manage-roles') && (
        <Link to="/dashboard/role-management" style={linkStyle}>Role Management</Link>
      )}

      {user.role?.permissions?.includes('edit-settings') && (
        <Link to="/dashboard/settings" style={linkStyle}>Badge Settings</Link>
      )}

      {user.role?.permissions?.includes('edit-server-mode') && (
        <Link to="/dashboard/server-mode" style={linkStyle}>Server Mode</Link>
      )}
    </nav>
  );
}

export default function DashboardLayout() {
  return (
    <div>
      <DashboardNav />
      <main style={{ padding: '0 20px' }}>
        {/* The nested route components (like your Dashboard summary) will be rendered here */}
        <Outlet />
      </main>
    </div>
  );
}