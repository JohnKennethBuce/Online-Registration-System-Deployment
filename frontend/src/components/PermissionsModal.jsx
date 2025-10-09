import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function PermissionsModal({ role, allPermissions, onSave, onCancel }) {
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    if (role) {
      setSelectedPermissions(role.permissions || []);
    }
  }, [role]);

  const handleCheckboxChange = (permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = () => {
    onSave(role.id, selectedPermissions);
  };

  if (!role) return null;

  return (
    <Modal isOpen={true} onClose={onCancel} title={`Edit Permissions for: ${role.name}`}>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {allPermissions.map(permission => (
          <div key={permission}>
            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission)}
                onChange={() => handleCheckboxChange(permission)}
              />
              {permission}
            </label>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button type="button" onClick={onCancel} style={{ marginRight: '10px' }}>Cancel</button>
        <button type="button" onClick={handleSave} style={{ fontWeight: 'bold' }}>Save Permissions</button>
      </div>
    </Modal>
  );
}