import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import BadgePrint from "../components/BadgePrint";

export default function BadgePrintPage() {
  const { ticket } = useParams();
  const [registration, setRegistration] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printAttempted = useRef(false);

  useEffect(() => {
    // Inject print CSS
    const style = document.createElement("style");
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
        .print-button {
          display: none !important;
        }
      }
      .print-button {
        display: none !important;
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
      } catch (err) {
        setError(
          err.response?.data?.message ||
            `Failed to load data for ticket ${ticket}.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDataForBadge();

    return () => {
      document.head.removeChild(style);
    };
  }, [ticket]);

  useEffect(() => {
    if (registration && settings && !loading && !error && !printAttempted.current) {
      printAttempted.current = true;

      // Function to ensure everything is rendered
      const waitForFullRender = () => {
        // Check if all images and resources are done loading
        const allImagesLoaded = Array.from(document.images).every(
          (img) => img.complete
        );

        if (allImagesLoaded) {
          // Wait a bit for any QR or dynamic rendering
          setTimeout(() => {
            window.print();
          }, 500);
        } else {
          // Retry after 500ms until everything is ready
          setTimeout(waitForFullRender, 500);
        }
      };

      waitForFullRender();

      window.onafterprint = () => {
        try {
          window.close();
          setTimeout(() => {
            if (!window.closed) {
              window.location.href = "/";
            }
          }, 1500);
        } catch {
          window.location.href = "/";
        }
      };
    }
  }, [registration, settings, loading, error]);

  if (loading) return <p>⏳ Loading badge data...</p>;
  if (error) return <p style={{ color: "red" }}>❌ Error: {error}</p>;
  if (!registration || !settings)
    return <p>Could not find data for this badge.</p>;

  return (
    <div className="badge-container" style={{ textAlign: "center" }}>
      <button
        className="print-button"
        onClick={() => window.print()}
        style={{ display: "none" }}
      >
        🖨️ Print Badge
      </button>

      <BadgePrint settings={settings} registration={registration} showQr={false} />
    </div>
  );
}
