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
};
// --- END: Design & Style Objects ---

export default function OnsiteRegistrationPage() {
  // All your existing state and logic remains unchanged
  const { user } = useAuth();
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !['admin', 'superadmin'].includes(user.role?.name)) {
      setError('You must be logged in as an admin or superadmin to perform registration.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/registrations', form);
      const ticketNumber = res.data.registration.ticket_number;
      setMessage('✅ Registration Successful! The badge is now printing...');
      window.open(`/print-badge/${ticketNumber}`, '_blank');
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
            <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required style={{...styles.input, flex: '1 1 calc(50% - 8px)'}} />
            <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required style={{...styles.input, flex: '1 1 calc(50% - 8px)'}} />
          </div>
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" type="email" required style={styles.input} />
          <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company Name (Optional)" style={styles.input} />
          <div style={styles.inputGroup}>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (Optional)" style={{...styles.input, flex: '1 1 calc(50% - 8px)'}} />
            <input name="address" value={form.address} onChange={handleChange} placeholder="Address (Optional)" style={{...styles.input, flex: '1 1 calc(50% - 8px)'}} />
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
            {isSubmitting ? 'Processing...' : 'Submit and Print Badge'}
          </button>
        </form>
      </div>
    </div>
  );
}