import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import AdminPage from "./pages/AdminPage";
import SuperadminPage from "./pages/SuperadminPage";
import Unauthorized from "./pages/Unauthorized";
import DashboardPage from "./pages/DashboardPage";
import { useState } from "react";

// 🔹 NavBar Component
function NavBar() {
  const { user, logout } = useAuth();

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
          {" | "}
          <button onClick={logout}>Logout</button>
        </>
      )}
    </nav>
  );
}

// 🔹 Login Page
function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) window.location.href = "/dashboard";
    else alert("Invalid credentials");
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

// 🔹 Home Page
function Home() {
  return (
    <div>
      <h2>Home</h2>
      <p>Welcome to the Online Registration System 🚀</p>
    </div>
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
