/**
 * ===========================================================
 * 🧾 OnlineRegistrationPage.jsx
 * ===========================================================
 * 🔹 Author: John Kenneth Buce
 * 🔹 Purpose: Handles event registration, QR generation, and display
 * 🔹 Connected API:Laravel backend via Axios (`/api/registrations`)
 *
 * ✅ Updated: Added demographics, survey fields, and email validation
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
    maxWidth: "700px",
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
    width: '100%',
    padding: '14px 18px',
    fontSize: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  select: {
    width: '100%',
    padding: '14px 18px',
    fontSize: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  textarea: {
    width: '100%',
    padding: '14px 18px',
    fontSize: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    resize: 'vertical',
    minHeight: '80px',
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
  // Section styles
  section: {
    marginBottom: "20px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#007bff",
    marginBottom: "15px",
    paddingBottom: "10px",
    borderBottom: "2px solid #007bff",
  },
  optionalBadge: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#28a745",
    color: "white",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    marginLeft: "10px",
  },
  helpText: {
    fontSize: "14px",
    color: "#6c757d",
    marginBottom: "15px",
    padding: "10px",
    backgroundColor: "#e7f3ff",
    borderRadius: "6px",
    borderLeft: "4px solid #17a2b8",
  },
  // ✅ NEW: Email validation styles
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldError: {
    color: '#dc3545',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '-4px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  fieldSuccess: {
    color: '#28a745',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '-4px',
  },
  // ✅ Confirmation Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'slideIn 0.3s ease-out',
  },
  modalHeader: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#343a40',
    marginBottom: '20px',
    textAlign: 'center',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '15px',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#6c757d',
    minWidth: '120px',
  },
  infoValue: {
    color: '#212529',
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '25px',
  },
  warningIcon: {
    fontSize: '24px',
    marginRight: '10px',
    verticalAlign: 'middle',
  },
  warningText: {
    color: '#856404',
    fontSize: '15px',
    lineHeight: '1.5',
  },
  modalButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '25px',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: '#ffffff',
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
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
// ✅ Confirmation Modal Component
// ===========================================================
const ConfirmationModal = ({ isOpen, formData, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  // Format display values - only show filled fields
  const displayData = [
    { label: "First Name", value: formData.first_name, required: true },
    { label: "Last Name", value: formData.last_name, required: true },
    { label: "Email", value: formData.email || "Not provided" },
    { label: "Phone", value: formData.phone || "Not provided" },
    { label: "Address", value: formData.address || "Not provided" },
    { label: "Company", value: formData.company_name || "Not provided" },
    { label: "Designation", value: formData.designation || "Not provided" },
  ];

  // Optional fields (only show if filled)
  const optionalData = [];
  
  if (formData.age_range) {
    optionalData.push({ label: "Age Range", value: formData.age_range });
  }
  if (formData.gender) {
    optionalData.push({ 
      label: "Gender", 
      value: formData.gender === "Others" && formData.gender_other 
        ? `Others: ${formData.gender_other}` 
        : formData.gender 
    });
  }
  if (formData.industry_sector) {
    optionalData.push({ 
      label: "Industry", 
      value: formData.industry_sector === "Others" && formData.industry_sector_other 
        ? `Others: ${formData.industry_sector_other}` 
        : formData.industry_sector 
    });
  }

  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalHeader}>⚠️ Confirm Your Registration</h2>
        
        <div style={styles.infoSection}>
          <h3 style={{ marginBottom: "15px", color: "#343a40" }}>Please review your information:</h3>
          
          {/* Required Fields */}
          {displayData.map((item, index) => (
            <div key={index} style={{
              ...styles.infoRow,
              borderBottom: index === displayData.length - 1 && optionalData.length === 0 ? "none" : "1px solid #e0e0e0"
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

          {/* Optional Fields */}
          {optionalData.length > 0 && (
            <>
              <div style={{ margin: "15px 0", paddingTop: "15px", borderTop: "2px solid #dee2e6" }}>
                <h4 style={{ fontSize: "14px", color: "#6c757d", marginBottom: "10px" }}>Additional Information:</h4>
              </div>
              {optionalData.map((item, index) => (
                <div key={index} style={{
                  ...styles.infoRow,
                  borderBottom: index === optionalData.length - 1 ? "none" : "1px solid #e0e0e0"
                }}>
                  <span style={styles.infoLabel}>{item.label}:</span>
                  <span style={styles.infoValue}>{item.value}</span>
                </div>
              ))}
            </>
          )}
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
              e.target.style.backgroundColor = '#5a6268';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#6c757d';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            ← Go Back & Edit
          </button>
          <button
            onClick={onConfirm}
            style={styles.confirmButton}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#218838';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 15px rgba(40, 167, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#28a745';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 10px rgba(40, 167, 69, 0.3)';
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [emailError, setEmailError] = useState(""); // ✅ NEW: Email validation error

  // ✅ All form fields
  const [form, setForm] = useState({
    // Personal Info
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    company_name: "",
    designation: "",
    
    // Demographics
    age_range: "",
    gender: "",
    gender_other: "",
    
    // Survey Questions
    industry_sector: "",
    industry_sector_other: "",
    reason_for_attending: "",
    reason_for_attending_other: "",
    specific_areas_of_interest: "",
    specific_areas_of_interest_other: "",
    how_did_you_learn_about: "",
    how_did_you_learn_about_other: "",
    
    // System Info
    registration_type: "online",
    payment_status: "unpaid",
  });

  // ✅ Track "Others" field visibility
  const [showOtherFields, setShowOtherFields] = useState({
    gender: false,
    industry: false,
    reason: false,
    interest: false,
    learn: false
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

  // ✅ NEW: Email validation function
  const validateEmail = (email) => {
    if (!email.trim()) {
      setEmailError("");
      return true; // Empty is valid (field is optional)
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("❌ Invalid email format. Please enter a valid email address.");
      return false;
    }
    
    setEmailError("");
    return true;
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

  // ✅ UPDATED: Handle form changes including "Others" toggles and email validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // ✅ NEW: Validate email on change
    if (name === "email") {
      validateEmail(value);
    }

    // Handle "Others" field toggles
    if (name === "gender") {
      setShowOtherFields(prev => ({ ...prev, gender: value === "Others" }));
      if (value !== "Others") setForm(f => ({ ...f, gender_other: "" }));
    }
    
    if (name === "industry_sector") {
      setShowOtherFields(prev => ({ ...prev, industry: value === "Others" }));
      if (value !== "Others") setForm(f => ({ ...f, industry_sector_other: "" }));
    }
    
    if (name === "reason_for_attending") {
      setShowOtherFields(prev => ({ ...prev, reason: value === "Others" }));
      if (value !== "Others") setForm(f => ({ ...f, reason_for_attending_other: "" }));
    }
    
    if (name === "specific_areas_of_interest") {
      setShowOtherFields(prev => ({ ...prev, interest: value === "Others" }));
      if (value !== "Others") setForm(f => ({ ...f, specific_areas_of_interest_other: "" }));
    }
    
    if (name === "how_did_you_learn_about") {
      setShowOtherFields(prev => ({ ...prev, learn: value === "Others" }));
      if (value !== "Others") setForm(f => ({ ...f, how_did_you_learn_about_other: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;

    // Basic validation
    if (!form.first_name.trim() || !form.last_name.trim() || !form.company_name.trim()) {
      setError("Please fill in all required fields (First Name, Last Name, and Company).");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // ✅ NEW: Validate email if provided
    if (form.email.trim() && !validateEmail(form.email)) {
      setError("❌ Please provide a valid email address or leave the field empty.");
      // Scroll to email field
      document.querySelector('input[name="email"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  // Handle confirmed submission
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
      const status = err.response?.status;
      const errorData = err.response?.data;
      
      if (status === 409) {
        setError(`❌ ${errorData.error || 'This person is already registered.'}\n\nPlease verify the name or contact support.`);
      } else if (status === 422 && errorData.errors?.email) {
        // ✅ Handle Laravel validation error for email
        setError(`❌ ${errorData.errors.email[0]}`);
        setEmailError(errorData.errors.email[0]);
        document.querySelector('input[name="email"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setError(getErrorMessage(err));
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setPreparingQr(false);
      setIsSubmitting(false);
    }
  };

  // Handle cancel confirmation
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
        📝 Event Registration - ICEGEX 2025
      </h1>
      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* SECTION 1: Personal Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>👤 Personal Information</h3>
          
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
          
          {/* ✅ Email with Validation */}
          <div style={styles.fieldWrapper}>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address (Optional)"
              type="email"
              style={{
                ...styles.input,
                ...(emailError ? { borderColor: '#dc3545', borderWidth: '2px' } : {})
              }}
            />
            {/* ✅ Email Error Message */}
            {emailError && (
              <span style={styles.fieldError}>
                {emailError}
              </span>
            )}
            {/* ✅ Email Success Message */}
            {!emailError && form.email.trim() && (
              <span style={styles.fieldSuccess}>
                ✓ Valid email format
              </span>
            )}
          </div>
          
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number (Optional)"
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
          
          <input
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Designation/Job Title (Optional)"
            style={styles.input}
          />
        </div>

        {/* SECTION 2: Demographics (Optional) */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            📊 Demographics
            <span style={styles.optionalBadge}>Optional</span>
          </h3>
          <p style={styles.helpText}>
            This information helps us understand our attendees better and improve future events.
          </p>
          
          <select
            name="age_range"
            value={form.age_range}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">-- Select Age Range --</option>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55-64">55-64</option>
            <option value="65+">65+</option>
          </select>
          
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">-- Select Gender --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
            <option value="Others">Others</option>
          </select>
          
          {showOtherFields.gender && (
            <input
              name="gender_other"
              placeholder="Please specify your gender"
              value={form.gender_other}
              onChange={handleChange}
              style={styles.input}
            />
          )}
        </div>

        {/* SECTION 3: Event Survey (Optional) */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            📝 Event Survey
            <span style={styles.optionalBadge}>Optional</span>
          </h3>
          <p style={styles.helpText}>
            Help us serve you better! Your responses will help us tailor the event to your interests.
          </p>
          
          {/* Industry Sector */}
          <select
            name="industry_sector"
            value={form.industry_sector}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">-- Select Industry Sector --</option>
            <option value="Ice Cream / Gelato / Frozen Dessert Brand">Ice Cream / Gelato / Frozen Dessert Brand</option>
            <option value="Café / Bakery / Beverage or Dessert Shop">Café / Bakery / Beverage or Dessert Shop</option>
            <option value="Restaurant / Catering / Food Chain">Restaurant / Catering / Food Chain</option>
            <option value="Hotel / Resort / Hospitality">Hotel / Resort / Hospitality</option>
            <option value="Food or Dairy Manufacturer / Supplier">Food or Dairy Manufacturer / Supplier</option>
            <option value="Equipment / Packaging / Technology Provider">Equipment / Packaging / Technology Provider</option>
            <option value="Marketing / Events / Creative Services">Marketing / Events / Creative Services</option>
            <option value="Entrepreneur">Entrepreneur</option>
            <option value="Student">Student</option>
            <option value="General Visitor">General Visitor</option>
            <option value="Others">Others</option>
          </select>
          
          {showOtherFields.industry && (
            <input
              name="industry_sector_other"
              placeholder="Please specify your industry"
              value={form.industry_sector_other}
              onChange={handleChange}
              style={styles.input}
            />
          )}
          
          {/* Reason for Attending */}
          <select
            name="reason_for_attending"
            value={form.reason_for_attending}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">-- Reason for Attending --</option>
            <option value="Discover new ice cream, gelato, or soft serve products">Discover new ice cream, gelato, or soft serve products</option>
            <option value="Source ingredients, equipment, or packaging">Source ingredients, equipment, or packaging</option>
            <option value="Learn from demos, talks, or competitions">Learn from demos, talks, or competitions</option>
            <option value="Explore franchise or business opportunities">Explore franchise or business opportunities</option>
            <option value="Meet potential partners or suppliers">Meet potential partners or suppliers</option>
            <option value="Scout the event for future participation">Scout the event for future participation</option>
            <option value="Others">Others</option>
          </select>
          
          {showOtherFields.reason && (
            <textarea
              name="reason_for_attending_other"
              placeholder="Please specify your reason for attending"
              value={form.reason_for_attending_other}
              onChange={handleChange}
              style={styles.textarea}
            />
          )}
          
          {/* Areas of Interest */}
          <select
            name="specific_areas_of_interest"
            value={form.specific_areas_of_interest}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">-- Areas of Interest --</option>
            <option value="Ingredients / Flavor Innovations">Ingredients / Flavor Innovations</option>
            <option value="Machinery & Equipment">Machinery & Equipment</option>
            <option value="Packaging & Cold Chain">Packaging & Cold Chain</option>
            <option value="Toll Manufacturing">Toll Manufacturing</option>
            <option value="Retail Concepts & Franchises">Retail Concepts & Franchises</option>
            <option value="Gelato Techniques & Training">Gelato Techniques & Training</option>
            <option value="Dairy-based Products">Dairy-based Products</option>
            <option value="Non-Dairy / Vegan options">Non-Dairy / Vegan options</option>
            <option value="Others">Others</option>
          </select>
          
          {showOtherFields.interest && (
            <textarea
              name="specific_areas_of_interest_other"
              placeholder="Please specify your areas of interest"
              value={form.specific_areas_of_interest_other}
              onChange={handleChange}
              style={styles.textarea}
            />
          )}
          
          {/* How did you learn */}
          <select
            name="how_did_you_learn_about"
            value={form.how_did_you_learn_about}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">-- How did you learn about us? --</option>
            <option value="Ads on Facebook / Instagram">Ads on Facebook / Instagram</option>
            <option value="ICEGEX Official Page/Website / Social Media">ICEGEX Official Page/Website / Social Media</option>
            <option value="Email Invitation or Newsletter">Email Invitation or Newsletter</option>
            <option value="Word of Mouth (Family / Friends / Colleagues)">Word of Mouth (Family / Friends / Colleagues)</option>
            <option value="Exhibitor / Brand Partner Invitation">Exhibitor / Brand Partner Invitation</option>
            <option value="Media Feature or Influencer Affiliates">Media Feature or Influencer Affiliates</option>
            <option value="Industry Association / Government Agency">Industry Association / Government Agency</option>
            <option value="Event Listing Sites">Event Listing Sites</option>
            <option value="Posters / Billboards / Flyers">Posters / Billboards / Flyers</option>
            <option value="Others">Others</option>
          </select>
          
          {showOtherFields.learn && (
            <textarea
              name="how_did_you_learn_about_other"
              placeholder="Please specify how you learned about us"
              value={form.how_did_you_learn_about_other}
              onChange={handleChange}
              style={styles.textarea}
            />
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !!emailError}
          style={
            (isSubmitting || !!emailError)
                ? { ...styles.button, ...styles.disabledButton } 
                : { ...styles.button, ...registerButtonStyle }
          }
          onMouseEnter={(!isSubmitting && !emailError) ? registerOnMouseEnter : null}
          onMouseLeave={(!isSubmitting && !emailError) ? registerOnMouseLeave : null}
        >
          {isSubmitting ? "Processing..." : "Register Now"}
        </button>

        {/* ✅ Show message if email error prevents submission */}
        {emailError && (
          <p style={{ textAlign: 'center', color: '#dc3545', fontSize: '0.9rem', marginTop: '10px' }}>
            ⚠️ Please fix the email error above before submitting
          </p>
        )}
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        formData={form}
        onConfirm={handleConfirmedSubmit}
        onCancel={handleCancelConfirmation}
      />
    </div>
  );
}