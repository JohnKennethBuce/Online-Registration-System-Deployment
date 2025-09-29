import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import jsQR from "jsqr";

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await api.get("/registrations");
        setRegistrations(res.data.registrations);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load registrations");
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  // QR scanning
  const startScanning = async () => {
    setScanning(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
    requestAnimationFrame(tick);
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const tick = () => {
    if (!scanning) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      stopScanning();
      const ticketNumber = code.data.split("/").pop();
      handleScan(ticketNumber);
    } else {
      requestAnimationFrame(tick);
    }
  };

  const handleScan = async (ticketNumber) => {
    try {
      const res = await api.post("/registrations/scan", {
        ticket_number: ticketNumber,
      });
      alert(`Scan Successful: ${res.data.message}`);
    } catch (err) {
      alert(err.response?.data?.message || "Scan failed");
    }
  };

  const handlePrintBadge = async (ticketNumber) => {
    try {
      const res = await api.post(`/registrations/${ticketNumber}/print_badge`);
      alert(`Badge printed: ${res.data.message}`);
      const updated = await api.get("/registrations");
      setRegistrations(updated.data.registrations);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to print badge");
    }
  };

  const handlePrintTicket = async (ticketNumber) => {
    try {
      const res = await api.post(`/registrations/${ticketNumber}/print_ticket`);
      alert(`Ticket printed: ${res.data.message}`);
      const updated = await api.get("/registrations");
      setRegistrations(updated.data.registrations);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to print ticket");
    }
  };

  if (loading) return <p>Loading registrations...</p>;
  if (error) return <p style={{ color: "red" }}>❌ {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 Registrations</h2>
      <button onClick={startScanning} disabled={scanning}>Start QR Scan</button>
      <button onClick={stopScanning} disabled={!scanning}>Stop QR Scan</button>

      {scanning && (
        <div>
          <video ref={videoRef} style={{ width: "100%", maxWidth: "300px" }} />
          <canvas ref={canvasRef} width="300" height="300" style={{ display: "none" }} />
        </div>
      )}

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Ticket Number</th>
            <th>QR Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => (
            <tr key={reg.id}>
              <td>{reg.id}</td>
              <td>{reg.first_name} {reg.last_name}</td>
              <td>{reg.email}</td>
              <td>{reg.ticket_number}</td>
              <td>
                <img src={`/storage/${reg.qr_code_path}`} alt="QR Code" width="100" />
              </td>
              <td>
                <button onClick={() => handlePrintBadge(reg.ticket_number)}>Print Badge</button>
                <button onClick={() => handlePrintTicket(reg.ticket_number)}>Print Ticket</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
  async function handlePrintBadge(ticketNumber)
  {
    try
    {
        const res = await api.post(`/registrations/${ticketNumber}/print_badge`);
        alert('Badge printed: ${res.data.message}');

        // Refresh registrations
        const updated = await api.get("/registrations");
        setRegistrations(updated.data.registrations);
    }
    catch (err)
        {
            alert(err.response?.data?.message || "Failed to print badge");
        }
  }

  async function handlePrintTicket(ticketNumber)
  {
    try
    {
        const res = await api.post(`/registrations/${ticketNumber}/print_ticket`);
        alert('Ticket printed: ${res.data.message}');

        // Refresh registrations
        const updated = await api.get("/registrations");
        setRegistrations(updated.data.registrations);
    }
    catch (err)
        {
            alert(err.response?.data?.message || "Failed to print ticket");
        }
  }

  