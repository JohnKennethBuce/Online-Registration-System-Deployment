import { useState } from "react";
import api from "../api/axios";

export default function RegistrationForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    company_name: "",
    registration_type: "onsite",
    payment_status: "unpaid",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post("/registrations", form);
      setSuccess(`✅ ${res.data.message}`);
      // Reset form to its initial state
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        company_name: "",
        registration_type: "onsite",
        payment_status: "unpaid",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px", color: "#333", textAlign: "center" }}>➕ New Registration</h2>
      {error && <p style={{ color: "#dc3545", textAlign: "center", fontSize: "1rem", marginBottom: "15px" }}>{error}</p>}
      {success && <p style={{ color: "#28a745", textAlign: "center", fontSize: "1rem", marginBottom: "15px" }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          name="first_name"
          placeholder="First Name"
          value={form.first_name}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = "#ddd"}
        />
        <input
          name="last_name"
          placeholder="Last Name"
          value={form.last_name}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = "#ddd"}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = "#ddd"}
        />
        <input
          name="phone"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={handleChange}
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = "#ddd"}
        />
        <input
          name="address"
          placeholder="Address (optional)"
          value={form.address}
          onChange={handleChange}
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = "#ddd"}
        />
        <input
          name="company_name"
          placeholder="Company Name (optional)"
          value={form.company_name}
          onChange={handleChange}
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = "#ddd"}
        />

        <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span style={{ fontSize: "1rem", color: "#555" }}>Type:</span>
          <select
            name="registration_type"
            value={form.registration_type}
            onChange={handleChange}
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: "white",
              cursor: "pointer",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#007bff"}
            onBlur={(e) => e.target.style.borderColor = "#ddd"}
          >
            <option value="onsite">Onsite</option>
            <option value="online">Online</option>
            <option value="pre-registered">Pre-Registered</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span style={{ fontSize: "1rem", color: "#555" }}>Payment Status:</span>
          <select
            name="payment_status"
            value={form.payment_status}
            onChange={handleChange}
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: "white",
              cursor: "pointer",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#007bff"}
            onBlur={(e) => e.target.style.borderColor = "#ddd"}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
            transition: "background-color 0.3s",
            marginTop: "10px",
          }}
          onMouseOver={(e) => !loading && (e.target.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => !loading && (e.target.style.backgroundColor = "#007bff")}
        >
          {loading ? "Saving…" : "Register"}
        </button>
      </form>
    </div>
  );
}