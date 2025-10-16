import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

export default function ScannerPage() {
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const backendBase = api.defaults.baseURL; // http://127.0.0.1:8000/api

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const t = setInterval(focus, 1000); // keep focus for HID scanners
    return () => clearInterval(t);
  }, []);

  const extractTicket = (text) => {
    if (!text) return null;
    const s = String(text).trim();
    // Accept full URLs or plain text; find TICKET-XXXXXXXX...
    const match = s.toUpperCase().match(/TICKET-[A-Z0-9]+/);
    return match ? match[0] : null;
  };

  const handleProcess = async (ticket) => {
  setError('');
  setStatus(`Scanning ${ticket}...`);

  // Open a blank tab first to avoid popup blockers
  const printWin = window.open('', '_blank');

  try {
    // 1) Update statuses and log scan (printed / one-time reprinted)
    await api.post(`/registrations/${ticket}/scan`);

    // 2) Navigate the opened tab to the frontend badge print page
    const badgeUrl = `/print-badge/${ticket}`;
    if (printWin) {
      printWin.location = badgeUrl;
      printWin.focus();
    } else {
      window.open(badgeUrl, '_blank');
    }

    setStatus('Printing… Ready for next scan.');
    setRaw('');
    inputRef.current?.focus();
  } catch (err) {
    // Close the pre-opened tab if scan failed
    if (printWin) try { printWin.close(); } catch (_) {}

    const statusCode = err.response?.status;
    const msg =
      statusCode === 404 ? 'Ticket not found.' :
      statusCode === 403 ? 'Scan not allowed in current server mode or insufficient permission.' :
      statusCode === 409 ? 'Reprint limit reached for this badge.' :
      err.response?.data?.error || err.response?.data?.message || 'Scan/print failed.';
    setError(msg);
    setStatus('');
  }
};

  const onSubmit = (e) => {
    e.preventDefault();
    const ticket = extractTicket(raw);
    if (!ticket) {
      setError('Invalid scan. Could not find a ticket number.');
      setStatus('');
      return;
    }
    handleProcess(ticket);
  };

  const onKeyDown = (e) => {
    // Many scanners send Enter at the end → submit immediately
    if (e.key === 'Enter') {
      e.preventDefault();
      const ticket = extractTicket(raw);
      if (!ticket) {
        setError('Invalid scan. Could not find a ticket number.');
        setStatus('');
        return;
      }
      handleProcess(ticket);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2>Scan & Print Badge</h2>
      <p style={{ color: '#555' }}>
        Focus the box below and scan the QR. This page accepts either a full URL or just the ticket number.
      </p>

      {status && <p style={{ color: 'green' }}>{status}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={onSubmit}>
        <input
          ref={inputRef}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Scan QR here…"
          style={{ width: '100%', padding: 14, fontSize: 18 }}
          autoFocus
        />
        <button type="submit" style={{ marginTop: 12, padding: '10px 16px' }}>
          Print
        </button>
      </form>

      <div style={{ marginTop: 12, color: '#666' }}>
        - Scanner tip: enable the Enter/newline suffix in the scanner settings so the form auto-submits on scan.
      </div>
    </div>
  );
}