import { useState, useEffect } from 'react';

export default function EditRegistrationForm({ registration, onSave, onCancel }) {
  // Sanitize the initial data to prevent the uncontrolled input error
  const getInitialData = (reg) => ({
    ...reg,
    first_name: reg.first_name || '',
    last_name: reg.last_name || '',
    company_name: reg.company_name || '',
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
    // Only send the fields that can be edited, not the whole object
    const dataToSave = {
        id: formData.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
        email: formData.email, // Pass the decrypted email
        registration_type: formData.registration_type,
    };
    onSave(dataToSave);
};

  const inputStyle = { width: '95%', padding: '8px', marginBottom: '10px' };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>First Name</label><br/>
        <input name="first_name" value={formData.first_name} onChange={handleChange} style={inputStyle} required />
      </div>
      <div>
        <label>Last Name</label><br/>
        <input name="last_name" value={formData.last_name} onChange={handleChange} style={inputStyle} required />
      </div>
      <div>
        <label>Company Name</label><br/>
        <input name="company_name" value={formData.company_name} onChange={handleChange} style={inputStyle} />
      </div>
      {/* You can add more fields to edit here if needed */}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button type="button" onClick={onCancel} style={{ marginRight: '10px' }}>Cancel</button>
        <button type="submit" style={{ fontWeight: 'bold' }}>Save Changes</button>
      </div>
    </form>
  );
}