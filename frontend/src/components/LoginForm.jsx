import { useState } from "react";
import { useAuth } from "../context/AuthContext";


export default function LoginForm() {
  // UPDATED: Use `login` and `logout` to match AuthContext
  const { user, login, logout } = useAuth(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = async (e) => {
    e.preventDefault();
    try {
      // UPDATED: Call the `login` function
      const success = await login(email, password); 
      
      // UPDATED: Redirect on success instead of showing an alert
      if (success) {
        window.location.href = "/dashboard";
      } else {
        alert("Invalid credentials!");
      }
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
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <h3>Welcome, {user.name} ({user.role?.name})</h3>
          {/* UPDATED: Call the `logout` function */}
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
}