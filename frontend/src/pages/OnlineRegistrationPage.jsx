import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function OnlineRegistrationPage() {
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    registration_type: 'online', // Hardcoded for this page
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successfulReg, setSuccessfulReg] = useState(null);
  const backendUrl = api.defaults.baseURL.replace('/api', '');

  // Check the server mode on load
  useEffect(() => {
    const checkServerMode = async () => {
      try {
        const res = await api.get('/server-mode');
        setServerMode(res.data.current_mode.mode);
      } catch (err) {
        setError('Could not connect to the server. Please try again later.');
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
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/registrations', form);
      // On success, we store the registration data to show the QR code
      setSuccessfulReg(res.data.registration);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. This email may already be registered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <h2 style={{ padding: '20px' }}>Loading...</h2>;
  if (serverMode !== 'online' && serverMode !== 'both') {
    return <h2 style={{ padding: '20px' }}>Online registration is currently closed.</h2>;
  }

  // --- Success Screen ---
  // If registration was successful, show the QR code instead of the form
  if (successfulReg) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: 'auto' }}>
        <h2>✅ Registration Successful!</h2>
        <p>Please save your QR Code below. You will need it to check in and print your badge at the event.</p>
        <img 
          src={`${backendUrl}/storage/${successfulReg.qr_code_path}`} 
          alt="Your Registration QR Code" 
          style={{ border: '1px solid black', padding: '10px', maxWidth: '300px' }}
        />
        <h3>{successfulReg.first_name} {successfulReg.last_name}</h3>
        <p>Ticket Number: {successfulReg.ticket_number}</p>
        <button onClick={() => setSuccessfulReg(null)}>Register Another Person</button>
      </div>
    );
  }

  // --- Registration Form ---
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1>Online Registration</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required />
        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" type="email" required />
        <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company Name (Optional)" />
        <button type="submit" disabled={isSubmitting} style={{ padding: '10px', fontWeight: 'bold' }}>
          {isSubmitting ? 'Processing...' : 'Register'}
        </button>
      </form>
    </div>
  );
}