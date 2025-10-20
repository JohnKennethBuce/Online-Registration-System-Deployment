import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// --- START: Design & Style Objects ---
const styles = {
  page: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '600px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#1d2129',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#606770',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '16px',
    fontSize: '1.1rem',
    border: '1px solid #ccd0d5',
    borderRadius: '8px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  inputGroup: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s, transform 0.2s',
  },
  messageBox: (type) => ({
    backgroundColor: type === 'success' ? '#eaf7ec' : '#fff0f0',
    color: type === 'success' ? '#1e4620' : '#d93025',
    border: `1px solid ${type === 'success' ? '#a3d9a5' : '#ffc0c0'}`,
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: '500',
  }),
  // ✅ NEW: Confirmation Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'slideIn 0.3s ease-out',
  },
  modalHeader: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#343a40',
    marginBottom: '20px',
    textAlign: 'center',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '15px',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#6c757d',
    minWidth: '120px',
    textAlign: 'left',
  },
  infoValue: {
    color: '#212529',
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '25px',
  },
  warningIcon: {
    fontSize: '24px',
    marginRight: '10px',
    verticalAlign: 'middle',
  },
  warningText: {
    color: '#856404',
    fontSize: '15px',
    lineHeight: '1.5',
  },
  modalButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '25px',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: '#ffffff',
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  kioskNote: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196f3',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '15px',
    color: '#1565c0',
    fontSize: '14px',
    textAlign: 'center',
  },
};
// --- END: Design & Style Objects ---

// ✅ NEW: Confirmation Modal Component
const ConfirmationModal = ({ isOpen, formData, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  // Format display values
  const displayData = [
    { label: "First Name", value: formData.first_name, required: true },
    { label: "Last Name", value: formData.last_name, required: true },
    { label: "Email", value: formData.email || "Not provided" },
    { label: "Phone", value: formData.phone || "Not provided" },
    { label: "Address", value: formData.address || "Not provided" },
    { label: "Company", value: formData.company_name || "Not provided" },
  ];

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalHeader}>⚠️ Confirm Registration Details</h2>
        
        {/* ✅ Kiosk-specific note */}
        <div style={styles.kioskNote}>
          <strong>🖥️ Kiosk Mode:</strong> Badge will be printed immediately after confirmation
        </div>

        <div style={styles.infoSection}>
          <h3 style={{ marginBottom: "15px", color: "#343a40" }}>Please verify the registrant's information:</h3>
          {displayData.map((item, index) => (
            <div key={index} style={{
              ...styles.infoRow,
              borderBottom: index === displayData.length - 1 ? "none" : "1px solid #e0e0e0"
            }}>
              <span style={styles.infoLabel}>
                {item.label}{item.required && <span style={{ color: "#dc3545" }}> *</span>}:
              </span>
              <span style={{
                ...styles.infoValue,
                fontWeight: item.required ? "600" : "normal",
                color: item.value === "Not provided" ? "#6c757d" : "#212529"
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.warningBox}>
          <span style={styles.warningIcon}>⚠️</span>
          <span style={styles.warningText}>
            <strong>Important Notice:</strong><br />
            Once you submit this registration, the information <strong>CANNOT be edited or modified</strong>. 
            The badge will be printed immediately. Please ensure all information is correct before proceeding.
            <br /><br />
            <strong>📋 Registration Type:</strong> On-Site (Walk-in)
          </span>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p style={{ fontSize: "16px", color: "#343a40", fontWeight: "500" }}>
            Is all the information correct?
          </p>
        </div>

        <div style={styles.modalButtons}>
          <button
            onClick={onCancel}
            style={styles.cancelButton}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#5a6268';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#6c757d';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            ← Go Back & Edit
          </button>
          <button
            onClick={onConfirm}
            style={styles.confirmButton}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#218838';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 15px rgba(40, 167, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#28a745';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 10px rgba(40, 167, 69, 0.3)';
            }}
          >
            ✓ Confirm & Print Badge
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OnsiteRegistrationPage() {
  const { user } = useAuth();
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false); // ✅ NEW: Confirmation modal state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    registration_type: 'onsite',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initialForm = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    registration_type: 'onsite',
  };

  const getErrorMessage = (err) => {
    const resp = err.response;
    if (resp?.status === 422 && resp.data?.errors) {
      const first = Object.values(resp.data.errors).flat()[0];
      return first || 'Validation failed.';
    }
    return resp?.data?.message || resp?.data?.error || 'Registration failed. Please try again.';
  };

  useEffect(() => {
    const checkServerMode = async () => {
      try {
        const res = await api.get('/server-mode/status');
        setServerMode(res.data.current_mode?.mode || null);
      } catch (err) {
        setError('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };
    checkServerMode();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ UPDATED: Show confirmation modal instead of direct submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !['admin', 'superadmin'].includes(user.role?.name)) {
      setError('You must be logged in as an admin or superadmin to perform registration.');
      return;
    }

    // Basic validation
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Please fill in at least the first and last name.');
      return;
    }

    // Clear any existing errors before showing modal
    setError('');
    
    // Show confirmation modal
    setShowConfirmation(true);
  };

  // ✅ NEW: Handle confirmed submission
  const handleConfirmedSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setError('');
    setMessage('');
    
    try {
      const res = await api.post('/registrations', form);
      const ticketNumber = res.data.registration.ticket_number;
      setMessage('✅ Registration Successful! The badge is now printing...');
      
      // Open print window
      window.open(`/print-badge/${ticketNumber}`, '_blank');
      
      // Reset form after a delay
      setTimeout(() => {
        setForm(initialForm);
        setMessage('Ready for the next registrant.');
      }, 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ NEW: Handle cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };
  
  // --- UI RENDER STATES (REDESIGNED) ---

  const renderNotice = (title, message) => (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{...styles.title, fontSize: '1.8rem'}}>{title}</h2>
        <p style={styles.subtitle}>{message}</p>
      </div>
    </div>
  );

  if (loading) return renderNotice("Loading Kiosk...", "Connecting to the registration server.");
  if (serverMode !== 'onsite' && serverMode !== 'both') {
    return renderNotice("Kiosk Mode Disabled", "Onsite registration is currently closed.");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>On-Site Registration</h1>
        <p style={styles.subtitle}>Enter the registrant's details below to print their badge.</p>

        {message && <div style={styles.messageBox('success')}>{message}</div>}
        {error && <div style={styles.messageBox('error')}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input 
              name="first_name" 
              value={form.first_name} 
              onChange={handleChange} 
              placeholder="First Name *" 
              required 
              style={{...styles.input, flex: '1 1 calc(50% - 8px)'}} 
            />
            <input 
              name="last_name" 
              value={form.last_name} 
              onChange={handleChange} 
              placeholder="Last Name *" 
              required 
              style={{...styles.input, flex: '1 1 calc(50% - 8px)'}} 
            />
          </div>
          <input 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            placeholder="Email Address (Optional)" 
            type="email" 
            style={styles.input} 
          />
          <input 
            name="company_name" 
            value={form.company_name} 
            onChange={handleChange} 
            placeholder="Company/Organization (Optional)" 
            style={styles.input} 
          />
          <div style={styles.inputGroup}>
            <input 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              placeholder="Phone (Optional)" 
              style={{...styles.input, flex: '1 1 calc(50% - 8px)'}} 
            />
            <input 
              name="address" 
              value={form.address} 
              onChange={handleChange} 
              placeholder="Address (Optional)" 
              style={{...styles.input, flex: '1 1 calc(50% - 8px)'}} 
            />
          </div>
        
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.button,
              ...(isSubmitting && { backgroundColor: '#6c757d', cursor: 'not-allowed' }),
            }}
            onMouseOver={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#0056b3'; }}
            onMouseOut={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#007bff'; }}
          >
            {isSubmitting ? 'Processing...' : 'Review & Print Badge'}
          </button>
        </form>
      </div>

      {/* ✅ NEW: Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        formData={form}
        onConfirm={handleConfirmedSubmit}
        onCancel={handleCancelConfirmation}
      />
    </div>
  );
}