import { useState, useEffect } from "react";
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

  const isPreRegistered = form.registration_type === "pre-registered";

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
      
      const successMessage = isPreRegistered 
        ? `✅ Pre-registered attendee added successfully!`
        : `✅ ${res.data.message}`;
      
      setSuccess(successMessage);
      
      // Reset form
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
      setError(err.response?.data?.message || err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div style={{
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
      fontFamily: "Arial, sans-serif",
      backgroundColor: isPreRegistered ? "#f0f8ff" : "#f8f9fa",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      transition: "background-color 0.3s ease",
    }}>
      <h2 style={{ 
        fontSize: "1.8rem", 
        marginBottom: "20px", 
        color: "#333", 
        textAlign: "center" 
      }}>
        {isPreRegistered ? "🎫 Pre-Registered Attendee" : "➕ New Registration"}
      </h2>
      
      {error && (
        <p style={{ 
          color: "#dc3545", 
          textAlign: "center", 
          fontSize: "1rem", 
          marginBottom: "15px",
          padding: "10px",
          backgroundColor: "#fee",
          borderRadius: "4px",
        }}>
          {error}
        </p>
      )}
      
      {success && (
        <p style={{ 
          color: "#28a745", 
          textAlign: "center", 
          fontSize: "1rem", 
          marginBottom: "15px",
          padding: "10px",
          backgroundColor: "#efe",
          borderRadius: "4px",
        }}>
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* Registration Type Selector */}
        <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span style={{ fontSize: "1rem", color: "#555", fontWeight: "600" }}>
            Registration Type:
          </span>
          <select
            name="registration_type"
            value={form.registration_type}
            onChange={handleChange}
            style={{
              padding: "12px",
              border: isPreRegistered ? "2px solid #4CAF50" : "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: "white",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#007bff"}
            onBlur={(e) => e.target.style.borderColor = isPreRegistered ? "#4CAF50" : "#ddd"}
          >
            <option value="onsite">Onsite</option>
            <option value="online">Online</option>
            <option value="pre-registered">Pre-Registered</option>
          </select>
        </label>

        {/* Name Fields */}
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            required
            style={{
              flex: 1,
              padding: "12px",
              border: isPreRegistered ? "1px solid #4CAF50" : "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#007bff"}
            onBlur={(e) => e.target.style.borderColor = isPreRegistered ? "#4CAF50" : "#ddd"}
          />
          <input
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            required
            style={{
              flex: 1,
              padding: "12px",
              border: isPreRegistered ? "1px solid #4CAF50" : "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#007bff"}
            onBlur={(e) => e.target.style.borderColor = isPreRegistered ? "#4CAF50" : "#ddd"}
          />
        </div>

        {/* Email Field */}
        <input
          type="email"
          name="email"
          placeholder="Email (optional)"
          value={form.email}
          onChange={handleChange}
          style={{
            padding: "12px",
            border: isPreRegistered ? "1px solid #4CAF50" : "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = isPreRegistered ? "#4CAF50" : "#ddd"}
        />

        {/* Phone Field */}
        <input
          name="phone"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={handleChange}
          style={{
            padding: "12px",
            border: isPreRegistered ? "1px solid #4CAF50" : "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = isPreRegistered ? "#4CAF50" : "#ddd"}
        />

        {/* Address Field */}
        <input
          name="address"
          placeholder="Address (optional)"
          value={form.address}
          onChange={handleChange}
          style={{
            padding: "12px",
            border: isPreRegistered ? "1px solid #4CAF50" : "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = isPreRegistered ? "#4CAF50" : "#ddd"}
        />

        {/* Company Name Field */}
        <input
          name="company_name"
          placeholder="Company Name (optional)"
          value={form.company_name}
          onChange={handleChange}
          style={{
            padding: "12px",
            border: isPreRegistered ? "1px solid #4CAF50" : "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#007bff"}
          onBlur={(e) => e.target.style.borderColor = isPreRegistered ? "#4CAF50" : "#ddd"}
        />

        {/* Payment Status - Now shown for ALL registration types */}
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px",
            backgroundColor: isPreRegistered ? "#4CAF50" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
            transition: "all 0.3s",
            marginTop: "10px",
          }}
          onMouseOver={(e) => !loading && (e.target.style.backgroundColor = isPreRegistered ? "#45a049" : "#0056b3")}
          onMouseOut={(e) => !loading && (e.target.style.backgroundColor = isPreRegistered ? "#4CAF50" : "#007bff")}
        >
          {loading ? "Processing..." : "Register"}
        </button>
      </form>
    </div>
  );
}