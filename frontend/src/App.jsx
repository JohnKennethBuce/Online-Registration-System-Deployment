import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
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

// 🔹 NavBar Component
function NavBar() {
  const { user } = useAuth();

  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      <Link to="/">Home</Link> |{" "}
      {!user && <Link to="/login">Login</Link>}

      {user && (
        <>
          {" | "}
          <Link to="/dashboard">Dashboard</Link>
          {" | "}
          <Link to="/admin">Admin</Link>
          {" | "}
          <Link to="/superadmin">Superadmin</Link>

          {/* NEW: Link for Server Mode, only for superadmin */}
          {user.role?.name === "superadmin" && (
            <>
              {" | "}
              <Link to="/server-mode">Server Mode</Link>
              {" | "}
              <Link to="/user-management">User Management</Link>
            </>
          )}

          {["admin", "superadmin"].includes(user.role?.name) && (
            <>
              {" | "}
              <Link to="/registrations">Registrations</Link>
              {" | "}
              <Link to="/register-new">New Registration</Link>
            </>
          )}
        </>
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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <SuperadminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          {/* NEW: Protected route for the Server Mode page */}
          <Route
            path="/server-mode"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <ServerModeManager />
              </ProtectedRoute>
            }
          />

          <Route
            path="/registrations"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <Registrations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/register-new"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <RegistrationForm />
              </ProtectedRoute>
            }
          />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;