import { Link, Outlet, useLocation } from "react-router-dom";
import { Nav, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";
import 'bootstrap/dist/css/bootstrap.min.css';

function DashboardSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const SidebarLink = ({ to, icon, children, permission }) => {
    if (permission && !user.role?.permissions?.includes(permission)) {
      return null;
    }

    const active = isActive(to);

    return (
      <Link
        to={to}
        className="text-decoration-none d-block mb-2"
        style={{
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: active ? '600' : '500',
          color: active ? '#fff' : '#2c3e50',
          background: active 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'transparent',
          transition: 'all 0.3s ease',
          borderLeft: active ? '4px solid #fff' : '4px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.target.style.background = 'rgba(102, 126, 234, 0.1)';
            e.target.style.paddingLeft = '24px';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.target.style.background = 'transparent';
            e.target.style.paddingLeft = '20px';
          }
        }}
      >
        <span className="me-3" style={{ fontSize: '1.2rem' }}>{icon}</span>
        {children}
      </Link>
    );
  };

  return (
    <div 
      className="bg-white shadow-sm h-100"
      style={{ 
        position: 'sticky',
        top: '0',
        padding: '20px',
        borderRight: '1px solid #dee2e6',
        minHeight: '100vh'
      }}
    >
      <h5 className="fw-bold mb-4 text-muted">DASHBOARD MENU</h5>
      
      <SidebarLink to="/dashboard" icon="📊">
        Summary
      </SidebarLink>

      <SidebarLink to="/dashboard/registrations" icon="📋" permission="view-registrations">
        Registrations
      </SidebarLink>

      <SidebarLink to="/dashboard/register-new" icon="➕" permission="create-registration">
        New Registration
      </SidebarLink>

      <SidebarLink to="/dashboard/scanner" icon="📷" permission="scan-registration">
        QR Scanner
      </SidebarLink>

      <SidebarLink to="/dashboard/reports" icon="📈" permission="view-reports">
        Reports
      </SidebarLink>

      <hr className="my-4" />

      <h6 className="fw-bold mb-3 text-muted small">SETTINGS</h6>

      <SidebarLink to="/dashboard/settings" icon="⚙️" permission="edit-settings">
        Badge Settings
      </SidebarLink>

      <SidebarLink to="/dashboard/server-mode" icon="🖥️" permission="edit-server-mode">
        Server Mode
      </SidebarLink>

      <hr className="my-4" />

      <h6 className="fw-bold mb-3 text-muted small">ADMINISTRATION</h6>

      <SidebarLink to="/dashboard/user-management" icon="👥" permission="view-users">
        User Management
      </SidebarLink>

      <SidebarLink to="/dashboard/role-management" icon="🔐" permission="manage-roles">
        Role Management
      </SidebarLink>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <Container fluid>
      <Row>
        <Col xs={12} lg={3} xl={2} className="px-0">
          <DashboardSidebar />
        </Col>
        <Col xs={12} lg={9} xl={10}>
          <main className="p-4">
            <Outlet />
          </main>
        </Col>
      </Row>
    </Container>
  );
}