// C:\xampp\htdocs\Online-Registration-System\frontend\src\App.jsx

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

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

// 🔹 NavBar Component
function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Hide NavBar on print-badge routes
  if (location.pathname.startsWith('/print-badge')) {
    return null;
  }

  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc", display: "flex", alignItems: "center" }}>
      <Link to="/">Home</Link>

      {user ? (
        <>
          &nbsp;|&nbsp;<Link to="/dashboard">Dashboard</Link>
          <div style={{ marginLeft: "auto" }}>
            <span>Welcome, {user.name}!</span>
            <button onClick={logout} style={{ marginLeft: '15px' }}>
              Logout
            </button>
          </div>
        </>
      ) : (
        <>&nbsp;|&nbsp;<Link to="/login">Login</Link></>
      )}
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/onsite" element={<OnsiteRegistrationPage />} />
          <Route path="/online" element={<OnlineRegistrationPage />} />
          <Route path="/print-badge/:ticket" element={<BadgePrintPage />} />

          {/* Protected Dashboard Routes are now nested */}
          <Route 
            path="/onsite" 
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <OnsiteRegistrationPage />
              </ProtectedRoute>
            }
          ></Route>

          {/* Protected Dashboard Routes are now nested */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* The 'index' is the default page shown at /dashboard */}
            <Route index element={<DashboardPage />} /> 

            {/* All other admin pages are now children of /dashboard */}
            <Route path="registrations" element={<Registrations />} />
            <Route path="register-new" element={<RegistrationForm />} />
            <Route path="user-management" element={<UserManagementPage />} />
            <Route path="role-management" element={<RoleManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="server-mode" element={<ServerModeManager />} />
            <Route path="scanner" element={<ScannerPage />} />

            {/* The old /admin and /superadmin pages can be removed or kept as needed */}
            <Route path="admin" element={<AdminPage />} />
            <Route path="superadmin" element={<SuperadminPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;