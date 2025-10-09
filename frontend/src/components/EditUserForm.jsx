import { useState, useEffect } from 'react';

export default function EditUserForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState(user);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputStyle = { width: '95%', padding: '8px', marginBottom: '10px' };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name</label><br/>
        <input name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />
      </div>
      <div>
        <label>Email</label><br/>
        <input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle} required />
      </div>
      <div>
        <label>New Password (optional)</label><br/>
        <input name="password" type="password" placeholder="Leave blank to keep current password" onChange={handleChange} style={inputStyle} />
      </div>
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button type="button" onClick={onCancel} style={{ marginRight: '10px' }}>Cancel</button>
        <button type="submit" style={{ fontWeight: 'bold' }}>Save Changes</button>
      </div>
    </form>
  );
}