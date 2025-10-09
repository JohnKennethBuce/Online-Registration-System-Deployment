import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function OnsiteRegistrationPage() {
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    registration_type: 'onsite', // Hardcoded for this page
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Check the server mode on load
  useEffect(() => {
    const checkServerMode = async () => {
      try {
        const res = await api.get('/server-mode');
        setServerMode(res.data.current_mode.mode);
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
      setMessage('Registration Successful! Your badge is now printing...');
      
      // Auto-print logic
      const ticketNumber = res.data.registration.ticket_number;
      const badgeUrl = `${api.defaults.baseURL}/registrations/${ticketNumber}/badge?show_qr=false&print=true`;
      window.open(badgeUrl, '_blank');

      // Reset form after a delay
      setTimeout(() => {
        setForm({ first_name: '', last_name: '', email: '', company_name: '', registration_type: 'onsite' });
        setMessage('Please wait for the next registrant...');
      }, 5000);

    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <h2>Loading Kiosk...</h2>;
  if (serverMode !== 'onsite' && serverMode !== 'both') {
    return <h2>Onsite registration is currently closed.</h2>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Onsite Registration</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* You can reuse your form component or build it here */}
        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required /><br/>
        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required /><br/>
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" type="email" required /><br/>
        <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company Name (Optional)" /><br/>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Submit and Print Badge'}
        </button>
      </form>
    </div>
  );
}