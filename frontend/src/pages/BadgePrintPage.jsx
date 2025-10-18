import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Spinner, Alert, Container } from "react-bootstrap";
import api from "../api/axios";
import BadgePrint from "../components/BadgePrint";

// Custom hook to get the previous value of a state or prop
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function BadgePrintPage() {
  const { ticket } = useParams();
  const [registration, setRegistration] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ADDED: State to manage the printing process
  const [isPrinting, setIsPrinting] = useState(false);
  const prevIsPrinting = usePrevious(isPrinting);
  
  const printAttempted = useRef(false);

  // --- Main data fetching and print style injection ---
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page { size: 6.5cm 5.5cm landscape; margin: 0; }
        html, body { margin: 0; padding: 0; width: 6.5cm; height: 5.5cm; overflow: visible !important; }
        .badge-container { border: none !important; overflow: visible !important; page-break-after: avoid; }
        .no-print { display: none !important; }
      }
      @media screen {
        body { background-color: #f0f2f5; }
        .print-preview {
          max-width: 650px; margin: 2rem auto; padding: 2rem; background: white;
          border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
      } catch (err) {
        setError(err.response?.data?.message || `Failed to load data for ticket ${ticket}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchDataForBadge();

    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, [ticket]);

  // --- Auto-print trigger ---
  useEffect(() => {
    if (registration && settings && !loading && !error && !printAttempted.current) {
      printAttempted.current = true;

      const triggerPrintProcess = () => {
        setTimeout(() => {
          console.log("🚀 Kicking off print process...");
          setIsPrinting(true); // This will trigger the next useEffect
        }, 800); // Delay to ensure all images are rendered
      };

      const waitForImages = () => {
        const images = Array.from(document.images);
        if (images.length === 0) return triggerPrintProcess();
        
        Promise.all(images.map(img => !img.complete ? new Promise(resolve => { img.onload = img.onerror = resolve; }) : Promise.resolve()))
          .then(triggerPrintProcess);
      };

      waitForImages();
    }
  }, [registration, settings, loading, error]);

  // --- Print execution and state toggle ---
  useEffect(() => {
    if (isPrinting) {
      console.log("🖨️ Print dialog is opening (blocking JS)...");
      window.print();
      // THIS LINE ONLY RUNS *AFTER* THE PRINT DIALOG IS CLOSED
      console.log("..Print dialog closed. Toggling state.");
      setIsPrinting(false);
    }
  }, [isPrinting]);

  // --- "Print Finished" trigger for closing the window ---
  useEffect(() => {
    // This condition is ONLY true when the state changes from TRUE -> FALSE
    if (prevIsPrinting && !isPrinting) {
      console.log("✅ Print process finished. Closing window now.");
      setTimeout(() => window.close(), 200); // Close window
    }
  }, [prevIsPrinting, isPrinting]);


  // --- Render States ---
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
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
        </Alert>
      </Container>
    );
  }

  if (!registration || !settings) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <p>Could not find data for this badge.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="print-preview">
       <div className="no-print text-center mb-4">
        <h4 className="mb-2">Badge Print Preview</h4>
        <p className="text-muted">The print dialog will open automatically.</p>
        <p className="text-info small mb-3">
          This window will close automatically after the print job is sent.
        </p>
        <button className="btn btn-primary" onClick={() => setIsPrinting(true)}>
          🖨️ Print Again
        </button>
      </div>

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