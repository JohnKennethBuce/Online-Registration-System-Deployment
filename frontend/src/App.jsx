import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { useState, useEffect } from 'react'; // ⬅️ ADD THIS LINE
import { AuthProvider, useAuth } from "./context/AuthContext";
import api from './api/axios'; // ⬅️ ADD THIS LINE TOO
import ProtectedRoute from "./ProtectedRoute";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


// Import all pages
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import SuperadminPage from "./pages/SuperadminPage";
import Unauthorized from "./pages/Unauthorized";
import DashboardPage from "./pages/DashboardPage";
import Registrations from "./pages/Registrations";
import RegistrationForm from "./pages/RegistrationForm";
import ServerModeManager from "./pages/ServerModeManager"; 
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import OnsiteRegistrationPage from './pages/OnsiteRegistrationPage';
import OnlineRegistrationPage from './pages/OnlineRegistrationPage';
import RoleManagementPage from './pages/RoleManagementPage';
import DashboardLayout from "./pages/DashboardLayout";
import ScannerPage from './pages/ScannerPage';
import BadgePrintPage from './pages/BadgePrintPage';
import Reports from './pages/Reports';  

/// 🔹 Ultra-Modern NavBar Component - THIS IS THE ONE TO MODIFY
function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // ADD THESE NEW LINES
  const [logoPath, setLogoPath] = useState('');
  const backendUrl = api.defaults.baseURL.replace('/api', '');

  // ADD THIS useEffect
  useEffect(() => {
    fetchLogo();
  }, []);

  // ADD THIS FUNCTION
  const fetchLogo = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.registration_logo_path) {
        setLogoPath(res.data.registration_logo_path);
      }
    } catch (err) {
      console.error('Failed to fetch logo:', err);
    }
  };

  // ADD THIS HELPER FUNCTION
  const getImageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = String(path)
      .replace(/\\/g, '/')
      .replace(/^\/?storage\/?/i, '');
    return `${backendUrl}/storage/${normalized}`;
  };

  // Hide NavBar on print-badge routes
  if (location.pathname.startsWith('/print-badge')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar 
      bg="white" 
      expand="lg" 
      className="navbar-modern shadow-smooth sticky-top"
      style={{
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
        padding: '1rem 0',
        zIndex: 1050
      }}
    >
      <Container>
        <Navbar.Brand 
          onClick={() => navigate('/')} 
          className="navbar-brand-modern"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* REPLACE THE EXISTING SPAN WITH THIS CONDITIONAL RENDERING */}
          {logoPath ? (
            <img 
              src={getImageUrl(logoPath)}
              alt="Registration Logo"
              style={{
                height: '40px',
                width: 'auto',
                maxWidth: '60px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3))',
                animation: 'float 3s ease-in-out infinite'
              }}
              onError={(e) => {
                console.error('Logo failed to load');
                setLogoPath(''); // Reset logo path on error
              }}
            />
          ) : (
            <span 
              style={{ 
                fontSize: '2rem',
                filter: 'drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3))',
                animation: 'float 3s ease-in-out infinite'
              }}
            >
              🎫
            </span>
          )}
          
          <span>Registration System</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Home Link */}
            <Nav.Link 
              onClick={() => navigate('/')}
              className={`nav-link-modern ${location.pathname === '/' ? 'active' : ''}`}
              style={{
                padding: '0.6rem 1.2rem',
                margin: '0 0.25rem',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.95rem',
                color: location.pathname === '/' ? '#667eea' : '#2c3e50',
                background: location.pathname === '/' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span className="me-2">🏠</span>
              Home
            </Nav.Link>

            {user ? (
              <>
                {/* Dashboard Link */}
                <Nav.Link 
                  onClick={() => navigate('/dashboard')}
                  className={`nav-link-modern ${location.pathname.startsWith('/dashboard') ? 'active' : ''}`}
                  style={{
                    padding: '0.6rem 1.2rem',
                    margin: '0 0.25rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    color: location.pathname.startsWith('/dashboard') ? '#667eea' : '#2c3e50',
                    background: location.pathname.startsWith('/dashboard') ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span className="me-2">📊</span>
                  Dashboard
                </Nav.Link>

                {/* User Dropdown */}
                <Dropdown align="end" className="ms-3 dropdown-modern">
                  <Dropdown.Toggle 
                    as={Button}
                    variant="outline-primary" 
                    id="user-dropdown"
                    className="dropdown-toggle-modern"
                    bsPrefix="custom-dropdown-toggle"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '12px',
                      border: '2px solid transparent',
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #667eea, #764ba2) border-box',
                      color: '#667eea',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Animated background on hover */}
                    <span 
                      className="dropdown-bg-effect"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        opacity: 0,
                        transition: 'opacity 0.4s ease',
                        zIndex: -1
                      }}
                    />
                    
                    <span 
                      style={{ 
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      👤
                    </span>
                    <span className="d-none d-md-inline">{user.name}</span>
                    
                    {/* Custom animated arrow */}
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 14 14" 
                      fill="currentColor"
                      className="dropdown-arrow"
                      style={{ 
                        transition: 'transform 0.3s ease',
                        marginLeft: '4px'
                      }}
                    >
                      <path d="M3 5l4 4 4-4H3z"/>
                    </svg>
                  </Dropdown.Toggle>

                  <Dropdown.Menu
                    className="dropdown-menu-modern"
                    style={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)',
                      padding: '0.75rem 0',
                      minWidth: '280px',
                      marginTop: '12px',
                      background: 'white',
                      backdropFilter: 'blur(20px)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* User Info Header with Gradient */}
                    <div
                      style={{
                        padding: '1.5rem 1.25rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        marginBottom: '0.75rem',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Decorative circles */}
                      <div style={{
                        position: 'absolute',
                        top: '-30px',
                        right: '-30px',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        animation: 'float 6s ease-in-out infinite'
                      }}/>
                      
                      <div style={{
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div 
                          style={{ 
                            fontSize: '2.5rem',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '3px solid rgba(255, 255, 255, 0.3)',
                            margin: '0 auto 1rem'
                          }}
                        >
                          👤
                        </div>
                        <div className="fw-bold text-center" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                          {user.name}
                        </div>
                        <div className="text-center" style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                          {user.email}
                        </div>
                        <div className="text-center">
                          <span 
                            className="badge"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.25)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              padding: '0.4rem 1rem',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              borderRadius: '20px'
                            }}
                          >
                            {user.role?.name || 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div style={{ padding: '0 0.5rem' }}>
                      <Dropdown.Item 
                        onClick={() => navigate('/dashboard/settings')}
                        className="dropdown-item-modern"
                        style={{
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          borderRadius: '10px',
                          marginBottom: '0.25rem',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: 'none',
                          background: 'transparent',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <span 
                          style={{ 
                            fontSize: '1.4rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '10px',
                            background: 'rgba(102, 126, 234, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          ⚙️
                        </span>
                        <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>Settings</span>
                      </Dropdown.Item>
                      
                      <Dropdown.Item 
                        onClick={() => navigate('/dashboard/user-management')}
                        className="dropdown-item-modern"
                        style={{
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          borderRadius: '10px',
                          marginBottom: '0.25rem',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: 'none',
                          background: 'transparent',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <span 
                          style={{ 
                            fontSize: '1.4rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '10px',
                            background: 'rgba(102, 126, 234, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          👥
                        </span>
                        <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>Profile</span>
                      </Dropdown.Item>
                      
                      <Dropdown.Divider style={{ margin: '0.75rem 0', opacity: 0.1 }} />
                      
                      <Dropdown.Item 
                        onClick={handleLogout} 
                        className="dropdown-item-modern dropdown-item-danger"
                        style={{
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          borderRadius: '10px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: 'none',
                          background: 'transparent',
                          color: '#dc3545',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <span 
                          style={{ 
                            fontSize: '1.4rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '10px',
                            background: 'rgba(220, 53, 69, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          🚪
                        </span>
                        <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Logout</span>
                      </Dropdown.Item>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <Button 
                variant="primary" 
                onClick={() => navigate('/login')}
                className="login-button-modern ms-3"
                style={{
                  borderRadius: '12px',
                  padding: '0.65rem 1.75rem',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <span className="me-2">🔐</span>
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="page-enter">
          <NavBar />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/onsite" element={<OnsiteRegistrationPage />} />
            <Route path="/online" element={<OnlineRegistrationPage />} />
            <Route path="/print-badge/:ticket" element={<BadgePrintPage />} />

            {/* Protected Onsite Route */}
            <Route 
              path="/onsite" 
              element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <OnsiteRegistrationPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Dashboard Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute roles={["admin", "superadmin"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} /> 
              <Route path="registrations" element={<Registrations />} />
              <Route path="register-new" element={<RegistrationForm />} />
              <Route path="user-management" element={<UserManagementPage />} />
              <Route path="role-management" element={<RoleManagementPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="server-mode" element={<ServerModeManager />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="reports" element={<Reports />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="superadmin" element={<SuperadminPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;