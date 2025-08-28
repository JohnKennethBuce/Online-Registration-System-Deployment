import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, roles }) {
  const { user, token, fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (token && !user) {
        await fetchUser();
      }
      setLoading(false);
    };
    init();
  }, [token, user, fetchUser]);

  if (loading) return <div>Loading...</div>;

  if (!token) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user?.role?.name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
