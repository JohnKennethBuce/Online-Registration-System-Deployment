import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function OnlineRegistrationPage() {
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    registration_type: 'online', // default here
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Success + QR states
  const [successfulReg, setSuccessfulReg] = useState(null);
  const [preparingQr, setPreparingQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const backendOrigin = api.defaults.baseURL.replace('/api', '');

  const initialForm = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    registration_type: 'online',
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const preloadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = reject;
      img.src = src;
    });

  const getErrorMessage = (err) => {
    const resp = err.response;
    if (resp?.status === 422 && resp.data?.errors) {
      const first = Object.values(resp.data.errors).flat()[0];
      return first || 'Validation failed.';
    }
    return resp?.data?.message || resp?.data?.error || 'Registration failed. This email may already be registered.';
  };

  // Check the server mode on load (public endpoint)
  useEffect(() => {
    const checkServerMode = async () => {
      try {
        const res = await api.get('/server-mode/status');
        setServerMode(res.data.current_mode?.mode || null);
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
    setSuccessfulReg(null);
    setPreparingQr(false);
    setQrUrl('');

    try {
      const { data } = await api.post('/registrations', form);
      const reg = data.registration;

      // Prefer backend-provided qr_url; fallback to building from qr_code_path if present
      const normalizedPath = reg.qr_code_path ? reg.qr_code_path.replace(/\\/g, '/') : null;
      const builtUrl = normalizedPath ? `${backendOrigin}/storage/${normalizedPath}` : null;
      const url = reg.qr_url || (builtUrl ? `${builtUrl}?v=${Date.now()}` : '');

      // Short "preparing" delay + preload QR if we have a URL already
      setPreparingQr(true);
      if (url) {
        try {
          await Promise.all([sleep(1500), preloadImage(url)]);
        } catch (_) {
          // If preloading fails initially (file not ready), wait a bit more and proceed
          await sleep(700);
        }
        setQrUrl(url);
      } else {
        // If qr_url wasn't ready yet, still show preparing state briefly
        await sleep(1500);
      }

      setSuccessfulReg(reg);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPreparingQr(false);
      setIsSubmitting(false);
      setForm(initialForm);
    }
  };

  if (loading) return <h2 style={{ padding: '20px' }}>Loading...</h2>;

  // Preparing screen (short delay before showing QR)
  if (preparingQr) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: 'auto' }}>
        <h2>Preparing your QR code…</h2>
        <p>Please wait a moment while we generate your QR.</p>
      </div>
    );
  }

  // Success screen (show QR)
  if (successfulReg) {
    const badgePage = `${api.defaults.baseURL}/registrations/${successfulReg.ticket_number}/badge`;

    const refreshQr = () => {
      if (!successfulReg.qr_url && !successfulReg.qr_code_path) return;
      const base = successfulReg.qr_url
        ? successfulReg.qr_url
        : `${backendOrigin}/storage/${successfulReg.qr_code_path.replace(/\\/g, '/')}`;
      setQrUrl(`${base}?v=${Date.now()}`);
    };

    return (
      <div style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: 'auto' }}>
        <h2>✅ Registration Successful!</h2>
        <p>Please save your QR Code below. You will need it to check in and print your badge at the event.</p>

        {qrUrl ? (
          <img
            src={qrUrl}
            alt="Your Registration QR Code"
            onError={() => setTimeout(refreshQr, 800)} // retry with cache-bust if file isn't ready yet
            style={{ border: '1px solid black', padding: '10px', maxWidth: '300px', width: '100%' }}
          />
        ) : (
          <div style={{ margin: '20px 0' }}>
            <p style={{ marginBottom: 8 }}>Your QR is being generated…</p>
            <button onClick={refreshQr}>Try loading QR again</button>
          </div>
        )}

        <h3 style={{ marginTop: 12 }}>
          {successfulReg.first_name} {successfulReg.last_name}
        </h3>
        <p>Ticket Number: {successfulReg.ticket_number}</p>

        <div style={{ marginTop: 12 }}>
          {qrUrl && (
            <>
              <a href={qrUrl} download={`QR-${successfulReg.ticket_number}.png`}>Download QR</a>
              <span style={{ margin: '0 6px' }}>|</span>
              <a href={qrUrl} target="_blank" rel="noreferrer">Open QR in new tab</a>
              <span style={{ margin: '0 6px' }}>|</span>
            </>
          )}
          {/* Public badge page (HTML) as a fallback */}
          <a href={badgePage} target="_blank" rel="noreferrer">Open Badge Page</a>
        </div>

        {/* Back to form for testing */}
        <button
          style={{ marginTop: 16 }}
          onClick={() => {
            setSuccessfulReg(null);
            setQrUrl('');
            setError('');
            setForm(initialForm);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Register Another Person
        </button>
      </div>
    );
  }

  if (serverMode !== 'online' && serverMode !== 'both') {
    return <h2 style={{ padding: '20px' }}>Online registration is currently closed.</h2>;
  }

  // Registration form
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1>Online Registration</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required />
        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" type="email" required />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (optional)" />
        <input name="address" value={form.address} onChange={handleChange} placeholder="Address (optional)" />
        <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company Name (Optional)" />
        <button type="submit" disabled={isSubmitting} style={{ padding: '10px', fontWeight: 'bold' }}>
          {isSubmitting ? 'Processing...' : 'Register'}
        </button>
      </form>
    </div>
  );
}