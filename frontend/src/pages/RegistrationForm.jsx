import { useState } from "react";
import api from "../api/axios";

export default function RegistrationForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    registration_type: "onsite", // default
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
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        company_name: "",
        registration_type: "onsite", //default
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>➕ New Registration</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="first_name"
          placeholder="First Name"
          value={form.first_name}
          onChange={handleChange}
          required
        /><br/>
        <input
          name="last_name"
          placeholder="Last Name"
          value={form.last_name}
          onChange={handleChange}
          required
        /><br/>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        /><br/>
        <input
          name="phone"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={handleChange}
        /><br/>
        <input
          name="address"
          placeholder="Address (optional)"
          value={form.address}
          onChange={handleChange}
        /><br/>

        <input
          name="company_name"
          placeholder="Company Name (optional)"
          value={form.company_name}
          onChange={handleChange}
        /><br/>

        <label>
          Type:
          <select
            name="registration_type"
            value={form.registration_type}
            onChange={handleChange}
          >
            <option value="onsite">Onsite</option>
            <option value="online">Online</option>
            <option value="pre-registered">Pre-Registered</option>
          </select>
        </label><br/>

        <button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Register"}
        </button>
      </form>
    </div>
  );
}
