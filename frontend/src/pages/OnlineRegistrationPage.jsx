/**
 * ===========================================================
 * 🧾 OnlineRegistrationPage.jsx
 * ===========================================================
 * 🔹 Author: John Kenneth Buce
 * 🔹 Purpose: Handles event registration, QR generation, and display
 * 🔹 Connected API: Django/Laravel backend via Axios (`/api/registrations`)
 *
 * (Original comments omitted for brevity)
 * ===========================================================
 */

import { useEffect, useState, useRef } from "react";
import api from "../api/axios";

// ===========================================================
// ✨ MODERN DESIGN STYLES (CSS-in-JS inspired)
// ===========================================================

const styles = {
  // Main Container
  container: {
    padding: "40px 20px",
    maxWidth: "500px",
    margin: "auto",
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  },
  // Form elements
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginTop: "25px",
  },
  input: {
    padding: "14px 18px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    width: "100%",
    boxSizing: "border-box",
  },
  // Base button style
  button: {
    padding: "14px 25px",
    fontSize: "17px",
    fontWeight: "600",
    borderRadius: "8px",
    cursor: "pointer",
    border: "none",
    transition: "transform 0.2s ease, background-color 0.2s ease, box-shadow 0.3s ease",
    letterSpacing: "0.5px",
    marginTop: "10px",
  },
  // Primary action button (Register)
  primaryButton: {
    backgroundColor: "#007bff",
    color: "#ffffff",
    boxShadow: "0 4px 10px rgba(0, 123, 255, 0.3)",
  },
  // Disabled button style
  disabledButton: {
    backgroundColor: "#cccccc",
    color: "#777777",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  // Success Screen
  successContainer: {
    padding: "40px",
    textAlign: "center",
    maxWidth: "500px",
    margin: "auto",
    opacity: 1,
    transition: "opacity 1.2s ease-in-out",
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    boxShadow: "0 8px 25px rgba(40, 167, 69, 0.15)",
    border: "2px solid #28a745",
  },
  qrCode: {
    border: "4px solid #ffffff",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    padding: "10px",
    maxWidth: "300px",
    width: "100%",
    margin: "25px auto",
  },
  // Error/Status messages
  error: {
    color: "#dc3545",
    backgroundColor: "#f8d7da",
    border: "1px solid #f5c6cb",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    textAlign: "center",
  },
  statusHeader: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#343a40",
  },
  statusSubtext: {
    color: "#6c757d",
    marginTop: "5px",
  },
  // ✅ NEW: Confirmation Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "30px",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    animation: "slideIn 0.3s ease-out",
  },
  modalHeader: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#343a40",
    marginBottom: "20px",
    textAlign: "center",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "15px",
  },
  infoSection: {
    backgroundColor: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #e0e0e0",
  },
  infoLabel: {
    fontWeight: "600",
    color: "#6c757d",
    minWidth: "120px",
  },
  infoValue: {
    color: "#212529",
    textAlign: "right",
    flex: 1,
    wordBreak: "break-word",
  },
  warningBox: {
    backgroundColor: "#fff3cd",
    border: "2px solid #ffc107",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "25px",
  },
  warningIcon: {
    fontSize: "24px",
    marginRight: "10px",
    verticalAlign: "middle",
  },
  warningText: {
    color: "#856404",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  modalButtons: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    marginTop: "25px",
  },
  confirmButton: {
    backgroundColor: "#28a745",
    color: "#ffffff",
    padding: "12px 30px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 10px rgba(40, 167, 69, 0.3)",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    color: "#ffffff",
    padding: "12px 30px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};

// ===========================================================
// 🖱️ HOVER EFFECT (Simulated using state for the primary button)
// ===========================================================
const useHover = (initialStyle, hoverStyle) => {
  const [style, setStyle] = useState(initialStyle);
  const onMouseEnter = () => setStyle({ ...initialStyle, ...hoverStyle });
  const onMouseLeave = () => setStyle(initialStyle);
  return [style, onMouseEnter, onMouseLeave];
};

// ===========================================================
// ✅ NEW: Confirmation Modal Component
// ===========================================================
const ConfirmationModal = ({ isOpen, formData, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  // Format display values
  const displayData = [
    { label: "First Name", value: formData.first_name, required: true },
    { label: "Last Name", value: formData.last_name, required: true },
    { label: "Email", value: formData.email || "Not provided" },
    { label: "Phone", value: formData.phone || "Not provided" },
    { label: "Address", value: formData.address || "Not provided" },
    { label: "Company", value: formData.company_name, required: true },
  ];

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalHeader}>⚠️ Confirm Your Registration</h2>
        
        <div style={styles.infoSection}>
          <h3 style={{ marginBottom: "15px", color: "#343a40" }}>Please review your information:</h3>
          {displayData.map((item, index) => (
            <div key={index} style={{
              ...styles.infoRow,
              borderBottom: index === displayData.length - 1 ? "none" : "1px solid #e0e0e0"
            }}>
              <span style={styles.infoLabel}>
                {item.label}{item.required && <span style={{ color: "#dc3545" }}> *</span>}:
              </span>
              <span style={{
                ...styles.infoValue,
                fontWeight: item.required ? "600" : "normal",
                color: item.value === "Not provided" ? "#6c757d" : "#212529"
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.warningBox}>
          <span style={styles.warningIcon}>⚠️</span>
          <span style={styles.warningText}>
            <strong>Important Notice:</strong><br />
            Once you submit this registration, you <strong>CANNOT edit or modify</strong> your information. 
            This device will also be locked and prevented from submitting another registration. 
            Please ensure all information is correct before proceeding.
          </span>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p style={{ fontSize: "16px", color: "#343a40", fontWeight: "500" }}>
            Are you sure you want to proceed with this registration?
          </p>
        </div>

        <div style={styles.modalButtons}>
          <button
            onClick={onCancel}
            style={styles.cancelButton}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#5a6268";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#6c757d";
              e.target.style.transform = "translateY(0)";
            }}
          >
            ← Go Back & Edit
          </button>
          <button
            onClick={onConfirm}
            style={styles.confirmButton}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#218838";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 15px rgba(40, 167, 69, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#28a745";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 10px rgba(40, 167, 69, 0.3)";
            }}
          >
            ✓ Yes, Submit Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OnlineRegistrationPage() {
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [settings, setSettings] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false); // ✅ NEW: Confirmation modal state

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    company_name: "",
    registration_type: "online",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successfulReg, setSuccessfulReg] = useState(null);
  const [preparingQr, setPreparingQr] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  const backendOrigin = api.defaults.baseURL.replace("/api", "");
  const isMounted = useRef(true);

  // Define hover styles for the primary button (Register)
  const [registerButtonStyle, registerOnMouseEnter, registerOnMouseLeave] = useHover(
    styles.primaryButton,
    { 
        backgroundColor: "#0056b3",
        transform: "translateY(-2px)",
        boxShadow: "0 6px 15px rgba(0, 123, 255, 0.45)" 
    }
  );

  // Define hover styles for generic button (Try again)
  const [retryButtonStyle, retryOnMouseEnter, retryOnMouseLeave] = useHover(
    { ...styles.button, backgroundColor: "#6c757d", color: "#ffffff" },
    { 
        backgroundColor: "#5a6268",
        transform: "scale(1.03)"
    }
  );

  // Function definitions remain unchanged
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const preloadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = reject;
      img.src = src;
    });

  const buildQrUrl = (reg) => {
    if (reg.qr_code_path) {
      const normalized = reg.qr_code_path
        .replace(/\\/g, "/")
        .replace(/^\/?public\/?/i, "")
        .replace(/^\/?storage\/?/i, "");
      return `${backendOrigin}/storage/${normalized}?v=${Date.now()}`;
    }

    if (reg.ticket_number) {
      const predicted = `qrcodes/${reg.ticket_number}.png`;
      return `${backendOrigin}/storage/${predicted}?v=${Date.now()}`;
    }

    return null;
  };

  const fetchLatestRegistration = async (ticketNumber) => {
    try {
      const { data } = await api.get(`/registrations/${ticketNumber}`);
      return data.registration || data;
    } catch {
      return null;
    }
  };

  const pollForQr = async (ticketNumber, baseReg) => {
    const delays = [800, 1000, 1200, 1400, 1600, 1800, 2000];
    for (let i = 0; i < delays.length; i++) {
      if (!isMounted.current) return false;

      let candidateUrl = buildQrUrl(baseReg);
      if (candidateUrl) {
        try {
          await preloadImage(candidateUrl);
          setQrUrl(candidateUrl);
          return true;
        } catch {}
      }

      const latest = await fetchLatestRegistration(ticketNumber);
      if (latest) {
        candidateUrl = buildQrUrl(latest);
        try {
          await preloadImage(candidateUrl);
          setSuccessfulReg(latest);
          setQrUrl(candidateUrl);
          return true;
        } catch {}
      }

      await sleep(delays[i]);
    }
    return false;
  };

  const getErrorMessage = (err) => {
    const resp = err.response;
    if (resp?.status === 422 && resp.data?.errors) {
      const first = Object.values(resp.data.errors).flat()[0];
      return first || "Validation failed.";
    }
    return (
      resp?.data?.message ||
      resp?.data?.error ||
      "Registration failed. This email may already be registered."
    );
  };

  /** 🔐 Device Lock Initialization */
  useEffect(() => {
    const saved = localStorage.getItem("regData");
    if (saved) {
      const reg = JSON.parse(saved);
      setLocked(true);
      setSuccessfulReg(reg);
      setQrUrl(buildQrUrl(reg));
    }
  }, []);

  /** 🧹 Developer Shortcut - Ctrl + Alt + R = Reset lock */
  useEffect(() => {
    const resetLock = (e) => {
      if (e.ctrlKey && e.altKey && e.key === "r") {
        localStorage.removeItem("regData");
        localStorage.removeItem("regLocked");
        alert("🔓 Registration lock cleared. Refresh to try again.");
      }
    };
    window.addEventListener("keydown", resetLock);
    return () => window.removeEventListener("keydown", resetLock);
  }, []);

  /** 🌐 Server Mode Check */
  useEffect(() => {
    const checkServerMode = async () => {
      try {
        const res = await api.get("/server-mode/status");
        setServerMode(res.data.current_mode?.mode || null);
      } catch {
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };
    checkServerMode();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ UPDATED: Show confirmation modal instead of direct submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;

    // Basic validation
    if (!form.first_name.trim() || !form.last_name.trim() || !form.company_name.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  // ✅ NEW: Handle confirmed submission
  const handleConfirmedSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setError("");
    setSuccessfulReg(null);
    setPreparingQr(false);
    setQrUrl("");

    try {
      const { data } = await api.post("/registrations", form);
      const reg = data.registration;

      setPreparingQr(true);
      await sleep(800);

      let candidateUrl = buildQrUrl(reg);
      if (candidateUrl) {
        try {
          await preloadImage(candidateUrl);
          setQrUrl(candidateUrl);
        } catch {
          await pollForQr(reg.ticket_number, reg);
        }
      } else {
        await pollForQr(reg.ticket_number, reg);
      }

      localStorage.setItem("regLocked", "true");
      localStorage.setItem("regData", JSON.stringify(reg));
      setLocked(true);
      setSuccessfulReg(reg);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPreparingQr(false);
      setIsSubmitting(false);
    }
  };

  // ✅ NEW: Handle cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  /** 🕒 Auto-close success after fade */
  useEffect(() => {
    if (successfulReg) {
      const fadeTimer = setTimeout(() => setFadeOut(false), 50000000);
      const closeTimer = setTimeout(() => window.close(), 50000000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [successfulReg]);

  // 🌀 UI States
  if (loading) return <h2 style={{ padding: "20px", textAlign: "center", color: "#343a40" }}>Loading...</h2>;
  
  if (preparingQr)
    return (
      <div style={{ ...styles.container, textAlign: "center" }}>
        <h2 style={{ color: "#007bff" }}>Preparing your QR code…</h2>
        <p style={{ ...styles.statusSubtext }}>Please wait while we generate your entry QR.</p>
      </div>
    );

  if (successfulReg) {
    const refreshQr = async () => {
      if (!successfulReg?.ticket_number) return;
      await pollForQr(successfulReg.ticket_number, successfulReg);
    };

    return (
      <div
        style={{
          ...styles.successContainer,
          opacity: fadeOut ? 0 : 1,
        }}
      >
        <h2 style={{ color: "#28a745" }}>✅ Registration Successful!</h2>
        <p style={{ ...styles.statusSubtext }}>Please save your QR Code for event check-in.</p>

        {qrUrl ? (
          <img
            src={qrUrl}
            alt="Your QR Code"
            onError={() => setTimeout(refreshQr, 800)}
            style={styles.qrCode}
          />
        ) : (
          <div style={{ margin: "30px 0" }}>
            <p style={{ marginBottom: 12, color: "#e0a800", fontWeight: "600" }}>
              Your QR is being generated. If it doesn't appear in a moment:
            </p>
            <button 
                onClick={refreshQr}
                style={{...styles.button, ...retryButtonStyle}}
                onMouseEnter={retryOnMouseEnter}
                onMouseLeave={retryOnMouseLeave}
                >
                🔄 Try Again / Refresh QR
            </button>
          </div>
        )}

        <h3 style={{ marginTop: 20, color: "#343a40" }}>
          {successfulReg.first_name} {successfulReg.last_name}
        </h3>
        <p style={{ color: "#007bff", fontWeight: "bold" }}>
        Ticket ID: #{successfulReg.id}</p>
        <p style={{ marginTop: 16, color: "#777" }}>
          This device is now restricted from submitting another registration.
        </p>
      </div>
    );
  }

  if (serverMode !== "online" && serverMode !== "both") {
    return (
      <div style={{ ...styles.container, textAlign: "center" }}>
        <h2 style={{ color: "#dc3545" }}>❌ Online registration is currently closed.</h2>
        <p style={{ ...styles.statusSubtext }}>Please check back during the designated registration period.</p>
      </div>
    );
  }

  if (locked && !successfulReg) {
    return (
      <div style={{ ...styles.container, textAlign: "center" }}>
        <h2 style={{ color: "#ffc107" }}>🔒 Access Restricted</h2>
        <p>This device has already completed registration. No duplicate entries allowed.</p>
        <p style={{ marginTop: 15, fontSize: "14px", color: "#999" }}>
          Press <strong>Ctrl + Alt + R</strong> to reset (admin only).
        </p>
      </div>
    );
  }

  // --- Main Form Display ---
  return (
    <div style={styles.container}>
      <h1 style={{ color: "#343a40", borderBottom: "2px solid #007bff", paddingBottom: "10px", marginBottom: "20px" }}>
        Event Registration
      </h1>
      {error && <p style={styles.error}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={styles.form}
      >
        <input
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="First Name *"
          required
          style={styles.input}
        />
        <input
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="Last Name *"
          required
          style={styles.input}
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email Address (Optional)"
          type="email"
          style={styles.input}
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone (Optional)"
          style={styles.input}
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address (Optional)"
          style={styles.input}
        />
        <input
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          placeholder="Company/Organization *"
          required
          style={styles.input}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={
            isSubmitting 
                ? { ...styles.button, ...styles.disabledButton } 
                : { ...styles.button, ...registerButtonStyle }
          }
          onMouseEnter={!isSubmitting ? registerOnMouseEnter : null}
          onMouseLeave={!isSubmitting ? registerOnMouseLeave : null}
        >
          {isSubmitting ? "Processing..." : "Register Now"}
        </button>
      </form>

      {/* ✅ NEW: Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        formData={form}
        onConfirm={handleConfirmedSubmit}
        onCancel={handleCancelConfirmation}
      />
    </div>
  );
}