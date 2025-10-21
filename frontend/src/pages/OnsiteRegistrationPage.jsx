import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// --- START: Design & Style Objects ---
const styles = {
  page: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '700px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#1d2129',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#606770',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    textAlign: 'left',
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
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    resize: 'vertical',
    minHeight: '80px',
  },
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s, transform 0.2s',
  },
  messageBox: (type) => ({
    backgroundColor: type === 'success' ? '#eaf7ec' : '#fff0f0',
    color: type === 'success' ? '#1e4620' : '#d93025',
    border: `1px solid ${type === 'success' ? '#a3d9a5' : '#ffc0c0'}`,
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: '500',
  }),
  section: {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#007bff',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #007bff',
  },
  optionalBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '10px',
  },
  helpText: {
    fontSize: '14px',
    color: '#6c757d',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#e7f3ff',
    borderRadius: '6px',
    borderLeft: '4px solid #17a2b8',
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
  // Modal Styles
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
    minWidth: '140px',
    textAlign: 'left',
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
  kioskNote: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196f3',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '15px',
    color: '#1565c0',
    fontSize: '14px',
    textAlign: 'center',
  },
};
// --- END: Design & Style Objects ---

// ✅ Confirmation Modal Component
const ConfirmationModal = ({ isOpen, formData, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  // Format display values - only show filled fields (excluding payment_status)
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
        <h2 style={styles.modalHeader}>⚠️ Confirm Registration Details</h2>
        
        {/* Kiosk-specific note */}
        <div style={styles.kioskNote}>
          <strong>🖥️ Kiosk Mode:</strong> Badge will be printed immediately after confirmation
        </div>

        <div style={styles.infoSection}>
          <h3 style={{ marginBottom: "15px", color: "#343a40" }}>Please verify the registrant's information:</h3>
          
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
            Once you submit this registration, the information <strong>CANNOT be edited or modified</strong>. 
            The badge will be printed immediately. Please ensure all information is correct before proceeding.
            <br /><br />
            <strong>📋 Registration Type:</strong> On-Site (Walk-in)
          </span>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p style={{ fontSize: "16px", color: "#343a40", fontWeight: "500" }}>
            Is all the information correct?
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
            ✓ Confirm & Print Badge
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OnsiteRegistrationPage() {
  const { user } = useAuth();
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [emailError, setEmailError] = useState(""); // ✅ NEW: Email validation error
  
  // ✅ All form fields (payment_status defaults to 'unpaid' - not user-editable)
  const [form, setForm] = useState({
    // Personal Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    designation: '',
    
    // Demographics
    age_range: '',
    gender: '',
    gender_other: '',
    
    // Survey Questions
    industry_sector: '',
    industry_sector_other: '',
    reason_for_attending: '',
    reason_for_attending_other: '',
    specific_areas_of_interest: '',
    specific_areas_of_interest_other: '',
    how_did_you_learn_about: '',
    how_did_you_learn_about_other: '',
    
    // System Info (not shown to user)
    registration_type: 'onsite',
    payment_status: 'unpaid', // ✅ Default, not editable by registrant
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initialForm = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    designation: '',
    age_range: '',
    gender: '',
    gender_other: '',
    industry_sector: '',
    industry_sector_other: '',
    reason_for_attending: '',
    reason_for_attending_other: '',
    specific_areas_of_interest: '',
    specific_areas_of_interest_other: '',
    how_did_you_learn_about: '',
    how_did_you_learn_about_other: '',
    registration_type: 'onsite',
    payment_status: 'unpaid',
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

  const getErrorMessage = (err) => {
    const resp = err.response;
    if (resp?.status === 422 && resp.data?.errors) {
      const first = Object.values(resp.data.errors).flat()[0];
      return first || 'Validation failed.';
    }
    return resp?.data?.message || resp?.data?.error || 'Registration failed. Please try again.';
  };

  useEffect(() => {
    const checkServerMode = async () => {
      try {
        const res = await api.get('/server-mode/status');
        setServerMode(res.data.current_mode?.mode || null);
      } catch (err) {
        setError('Could not connect to the server.');
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
    
    if (!user || !['admin', 'superadmin'].includes(user.role?.name)) {
      setError('You must be logged in as an admin or superadmin to perform registration.');
      return;
    }

    // Basic validation
    if (!form.first_name.trim() || !form.last_name.trim() || !form.company_name.trim()) {
      setError('Please fill in at least the first name, last name, and company.');
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

    // Clear any existing errors before showing modal
    setError('');
    
    // Show confirmation modal
    setShowConfirmation(true);
  };

  // Handle confirmed submission
  const handleConfirmedSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setError('');
    setMessage('');
    
    try {
      const res = await api.post('/registrations', form);
      const ticketNumber = res.data.registration.ticket_number;
      setMessage('✅ Registration Successful! The badge is now printing...');
      
      // Open print window
      window.open(`/print-badge/${ticketNumber}`, '_blank');
      
      // Reset form after a delay
      setTimeout(() => {
        setForm(initialForm);
        setShowOtherFields({
          gender: false,
          industry: false,
          reason: false,
          interest: false,
          learn: false
        });
        setEmailError(""); // ✅ Clear email error
        setMessage('Ready for the next registrant.');
      }, 4000);
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
      setIsSubmitting(false);
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };
  
  // --- UI RENDER STATES ---
  const renderNotice = (title, message) => (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{...styles.title, fontSize: '1.8rem'}}>{title}</h2>
        <p style={styles.subtitle}>{message}</p>
      </div>
    </div>
  );

  if (loading) return renderNotice("Loading Kiosk...", "Connecting to the registration server.");
  if (serverMode !== 'onsite' && serverMode !== 'both') {
    return renderNotice("Kiosk Mode Disabled", "Onsite registration is currently closed.");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>🖥️ On-Site Registration - ICEGEX 2025</h1>
        <p style={styles.subtitle}>Enter the registrant's details below to print their badge.</p>

        {message && <div style={styles.messageBox('success')}>{message}</div>}
        {error && <div style={styles.messageBox('error')}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* SECTION 1: Personal Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👤 Personal Information</h3>
            
            {/* First Name - Full Width */}
            <input 
              name="first_name" 
              value={form.first_name} 
              onChange={handleChange} 
              placeholder="First Name *" 
              required 
              style={styles.input} 
            />

            {/* Last Name - Full Width */}
            <input 
              name="last_name" 
              value={form.last_name} 
              onChange={handleChange} 
              placeholder="Last Name *" 
              required 
              style={styles.input} 
            />

            {/* ✅ Email with Validation - Full Width */}
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

            {/* Phone - Full Width */}
            <input 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              placeholder="Phone Number (Optional)" 
              style={styles.input} 
            />

            {/* Address - Full Width */}
            <input 
              name="address" 
              value={form.address} 
              onChange={handleChange} 
              placeholder="Address (Optional)" 
              style={styles.input} 
            />

            {/* Company - Full Width */}
            <input 
              name="company_name" 
              value={form.company_name} 
              onChange={handleChange} 
              placeholder="Company/Organization *" 
              required
              style={styles.input} 
            />

            {/* Designation - Full Width */}
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
              This information helps us understand our attendees better.
            </p>
            
            {/* Age Range - Full Width */}
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
            
            {/* Gender - Full Width */}
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
            
            {/* Gender Other - Full Width */}
            {showOtherFields.gender && (
              <input
                name="gender_other"
                placeholder="Please specify gender"
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
              Help us serve attendees better with these optional questions.
            </p>
            
            {/* Industry Sector - Full Width */}
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
            
            {/* Industry Other - Full Width */}
            {showOtherFields.industry && (
              <input
                name="industry_sector_other"
                placeholder="Please specify your industry"
                value={form.industry_sector_other}
                onChange={handleChange}
                style={styles.input}
              />
            )}
            
            {/* Reason for Attending - Full Width */}
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
            
            {/* Reason Other - Full Width */}
            {showOtherFields.reason && (
              <textarea
                name="reason_for_attending_other"
                placeholder="Please specify your reason for attending"
                value={form.reason_for_attending_other}
                onChange={handleChange}
                style={styles.textarea}
              />
            )}
            
            {/* Areas of Interest - Full Width */}
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
            
            {/* Interest Other - Full Width */}
            {showOtherFields.interest && (
              <textarea
                name="specific_areas_of_interest_other"
                placeholder="Please specify your specific interests"
                value={form.specific_areas_of_interest_other}
                onChange={handleChange}
                style={styles.textarea}
              />
            )}
            
            {/* How did you learn - Full Width */}
            <select
              name="how_did_you_learn_about"
              value={form.how_did_you_learn_about}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">-- How did you learn about ICEGEX 2025? --</option>
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
            
            {/* Learn Other - Full Width */}
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
            style={{
              ...styles.button,
              ...((isSubmitting || !!emailError) && { backgroundColor: '#6c757d', cursor: 'not-allowed' }),
            }}
            onMouseOver={(e) => { if (!isSubmitting && !emailError) e.currentTarget.style.backgroundColor = '#0056b3'; }}
            onMouseOut={(e) => { if (!isSubmitting && !emailError) e.currentTarget.style.backgroundColor = '#007bff'; }}
          >
            {isSubmitting ? 'Processing...' : 'Review & Print Badge'}
          </button>

          {/* ✅ Show message if email error prevents submission */}
          {emailError && (
            <p style={{ textAlign: 'center', color: '#dc3545', fontSize: '0.9rem', marginTop: '10px' }}>
              ⚠️ Please fix the email error above before submitting
            </p>
          )}
        </form>
      </div>

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