import { useState, useEffect } from 'react';

export default function EditRegistrationForm({ registration, onSave, onCancel }) {
  // Sanitize the initial data to prevent the uncontrolled input error
  const getInitialData = (reg) => ({
    ...reg,
    first_name: reg.first_name || '',
    last_name: reg.last_name || '',
    company_name: reg.company_name || '',
    email: reg.email || '',
    phone: reg.phone || '',
    address: reg.address || '',
    registration_type: reg.registration_type || 'onsite',
    payment_status: reg.payment_status || 'unpaid'
  });

  const [formData, setFormData] = useState(() => getInitialData(registration));

  // Update form data if the selected registration changes
  useEffect(() => {
    setFormData(getInitialData(registration));
  }, [registration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only send the fields that can be edited
    const dataToSave = {
      id: formData.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      company_name: formData.company_name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      registration_type: formData.registration_type,
      payment_status: formData.payment_status,
    };
    onSave(dataToSave);
  };

  const inputStyle = { 
    width: '100%', 
    padding: '8px', 
    marginBottom: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>First Name *</label>
        <input 
          name="first_name" 
          value={formData.first_name} 
          onChange={handleChange} 
          style={inputStyle} 
          required 
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Last Name *</label>
        <input 
          name="last_name" 
          value={formData.last_name} 
          onChange={handleChange} 
          style={inputStyle} 
          required 
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Email</label>
        <input 
          type="email"
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          style={inputStyle} 
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Phone</label>
        <input 
          name="phone" 
          value={formData.phone} 
          onChange={handleChange} 
          style={inputStyle} 
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Address</label>
        <input 
          name="address" 
          value={formData.address} 
          onChange={handleChange} 
          style={inputStyle} 
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Company Name</label>
        <input 
          name="company_name" 
          value={formData.company_name} 
          onChange={handleChange} 
          style={inputStyle} 
        />
      </div>

      {/* ✅ Registration Type with Pre-Registered */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Registration Type</label>
        <select
          name="registration_type"
          value={formData.registration_type}
          onChange={handleChange}
          style={{
            ...inputStyle,
            cursor: 'pointer',
            backgroundColor: 'white'
          }}
        >
          <option value="onsite">Onsite</option>
          <option value="online">Online</option>
          <option value="pre-registered">Pre-Registered</option>
        </select>
      </div>

      {/* ✅ Payment Status */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Payment Status</label>
        <select
          name="payment_status"
          value={formData.payment_status}
          onChange={handleChange}
          style={{
            ...inputStyle,
            cursor: 'pointer',
            backgroundColor: 'white'
          }}
        >
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        marginTop: '20px', 
        textAlign: 'right',
        paddingTop: '15px',
        borderTop: '1px solid #e0e0e0'
      }}>
        <button 
          type="button" 
          onClick={onCancel} 
          style={{ 
            marginRight: '10px',
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}