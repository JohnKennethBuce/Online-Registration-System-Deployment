import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Alert, Container } from 'react-bootstrap';
import api from "../api/axios";
import BadgePrint from "../components/BadgePrint";

export default function BadgePrintPage() {
  const { ticket } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printAttempted = useRef(false);
  const imagesLoaded = useRef(false);

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
        .no-print {
          display: none !important;
        }
      }
      @media screen {
        .print-preview {
          max-width: 650px;
          margin: 2rem auto;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
        
        console.log('✅ Badge data loaded:', regResponse.data);
        setRegistration(regResponse.data.registration);
        setSettings(settingsResponse.data);
      } catch (err) {
        console.error('❌ Error loading badge data:', err);
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
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [ticket]);

  useEffect(() => {
    if (registration && settings && !loading && !error && !printAttempted.current) {
      printAttempted.current = true;

      // Wait for all images to load
      const waitForImages = () => {
        const images = Array.from(document.images);
        
        if (images.length === 0) {
          // No images, proceed immediately
          triggerPrint();
          return;
        }

        const allLoaded = images.every((img) => img.complete && img.naturalHeight !== 0);

        if (allLoaded) {
          imagesLoaded.current = true;
          triggerPrint();
        } else {
          // Wait for images to load
          Promise.all(
            images.map(
              (img) =>
                new Promise((resolve) => {
                  if (img.complete) {
                    resolve();
                  } else {
                    img.onload = resolve;
                    img.onerror = resolve; // Resolve even on error
                  }
                })
            )
          ).then(() => {
            imagesLoaded.current = true;
            triggerPrint();
          });
        }
      };

      // Trigger print with slight delay
      const triggerPrint = () => {
        setTimeout(() => {
          console.log('🖨️ Triggering print dialog...');
          window.print();
        }, 800); // Give time for QR code and other elements
      };

      // Handle after print
      const handleAfterPrint = () => {
        console.log('✅ Print dialog closed');
        
        // ✅ FIXED: Use navigate instead of window.close to avoid warnings
        setTimeout(() => {
          navigate('/dashboard/scanner', { replace: true });
        }, 500);
      };

      window.addEventListener('afterprint', handleAfterPrint);

      // Start the process
      waitForImages();

      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [registration, settings, loading, error, navigate]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading badge data...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Badge</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <button 
              className="btn btn-outline-danger"
              onClick={() => navigate('/dashboard/scanner')}
            >
              ← Back to Scanner
            </button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!registration || !settings) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <p>Could not find data for this badge.</p>
          <button 
            className="btn btn-outline-warning"
            onClick={() => navigate('/dashboard/scanner')}
          >
            ← Back to Scanner
          </button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="print-preview">
      {/* Print Button (hidden in print) */}
      <div className="no-print text-center mb-4">
        <h4 className="mb-3">Badge Preview</h4>
        <p className="text-muted mb-3">Print dialog will open automatically</p>
        <div className="d-flex gap-2 justify-content-center">
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            🖨️ Print Again
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/dashboard/scanner')}
          >
            ← Back to Scanner
          </button>
        </div>
      </div>

      {/* Badge */}
      <div className="badge-container">
        <BadgePrint 
          settings={settings} 
          registration={registration} 
          showQr={false}
        />
      </div>
    </div>
  );
}