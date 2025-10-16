import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import BadgePrint from "../components/BadgePrint";

export default function BadgePrintPage() {
  const { ticket } = useParams();
  const [registration, setRegistration] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add print-specific CSS
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          size: 6.5cm 5.5cm landscape;
          margin: 0;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 6.5cm;
          height: 5.5cm;
          overflow: visible !important;
        }
        .badge-container {
          border: none !important;
          overflow: visible !important;
          page-break-after: avoid;
        }
      }
    `;
    document.head.appendChild(style);

    const fetchDataForBadge = async () => {
      try {
        const [regResponse, settingsResponse] = await Promise.all([
          api.get(`/registrations/${ticket}`),
          api.get("/settings"),
        ]);
        
        setRegistration(regResponse.data.registration);
        setSettings(settingsResponse.data);

        setTimeout(() => window.print(), 500);
      } catch (err) {
        setError(err.response?.data?.message || `Failed to load data for ticket ${ticket}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchDataForBadge();

    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, [ticket]);

  if (loading) return <p>⏳ Loading badge data...</p>;
  if (error) return <p style={{ color: "red" }}>❌ Error: {error}</p>;
  if (!registration || !settings) return <p>Could not find data for this badge.</p>;

  return (
    <div className="badge-container">
      <BadgePrint settings={settings} registration={registration} showQr={false} />
    </div>
  );
}