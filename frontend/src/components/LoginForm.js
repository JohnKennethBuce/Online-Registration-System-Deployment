import { useState } from "react";
import useAuth from "../hooks/useAuth";

export default function LoginForm() {
  const { user, handleLogin, handleLogout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = async (e) => {
    e.preventDefault();
    try {
      await handleLogin(email, password);
      alert("Login successful!");
    } catch (err) {
      alert("Invalid credentials!");
    }
  };

  return (
    <div>
      {!user ? (
        <form onSubmit={submitLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <h3>Welcome, {user.name} ({user.role?.name})</h3>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}
