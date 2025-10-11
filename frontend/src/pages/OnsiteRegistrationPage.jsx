import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function OnsiteRegistrationPage() {
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    registration_type: 'onsite', // default here
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

  // Check the server mode on load (public endpoint)
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
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/registrations', form);
      const ticketNumber = res.data.registration.ticket_number;

      setMessage('✅ Registration Successful! Your badge is now printing...');

      // Auto-print logic
      const badgeUrl = `${api.defaults.baseURL}/registrations/${ticketNumber}/badge?show_qr=false&print=true`;

      // Opening immediately after click reduces popup blockers
      window.open(badgeUrl, '_blank');

      // Reset form after a short delay for kiosk flow
      setTimeout(() => {
        setForm(initialForm);
        setMessage('Please wait for the next registrant...');
      }, 4000);

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <h2 style={{ padding: '20px' }}>Loading Kiosk...</h2>;
  if (serverMode !== 'onsite' && serverMode !== 'both') {
    return <h2 style={{ padding: '20px' }}>Onsite registration is currently closed.</h2>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1>Onsite Registration</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required />
        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" type="email" required />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (optional)" />
        <input name="address" value={form.address} onChange={handleChange} placeholder="Address (optional)" />
        <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company Name (Optional)" />
        <button type="submit" disabled={isSubmitting} style={{ padding: '10px', fontWeight: 'bold' }}>
          {isSubmitting ? 'Processing...' : 'Submit and Print Badge'}
        </button>
      </form>
    </div>
  );
}