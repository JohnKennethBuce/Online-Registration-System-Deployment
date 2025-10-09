import { useState } from 'react';

export default function AddUserForm({ roles, onSave, onCancel }) { // <-- Accepts roles as a prop
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: roles.find(r => r.name === 'admin')?.id || '', // Default to 'admin' role ID
  });

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
        <label>Password</label><br/>
        <input name="password" type="password" value={formData.password} onChange={handleChange} style={inputStyle} required minLength={8} />
      </div>
      
      {/* NEW: Role Selector Dropdown */}
      <div>
        <label>Role</label><br/>
        <select name="role_id" value={formData.role_id} onChange={handleChange} style={inputStyle}>
            {roles.map(role => (
                <option key={role.id} value={role.id}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </option>
            ))}
        </select>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button type="button" onClick={onCancel} style={{ marginRight: '10px' }}>Cancel</button>
        <button type="submit" style={{ fontWeight: 'bold' }}>Create User</button>
      </div>
    </form>
  );
}