import { useState, useEffect } from "react";
import api from "../api/axios";

export default function RegistrationForm() {
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
    registration_type: "onsite",
    payment_status: "unpaid",
  });

  const [preRegCode, setPreRegCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [preRegData, setPreRegData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showOtherFields, setShowOtherFields] = useState({
    gender: false,
    industry: false,
    reason: false,
    interest: false,
    learn: false
  });

  const isPreRegistered = form.registration_type === "pre-registered";
  const isComplimentary = form.registration_type === "complimentary";

  // ✅ Email validation function
  const validateEmail = (email) => {
    if (!email.trim()) {
      setEmailError("");
      return true;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("❌ Invalid email format. Please enter a valid email address.");
      return false;
    }
    
    setEmailError("");
    return true;
  };

  // ✅ Verify pre-registration OR complimentary code
  const handleVerifyPreReg = async () => {
    if (!preRegCode.trim()) {
      setError("Please enter a registration code");
      return;
    }

    setVerifying(true);
    setError(null);
    setPreRegData(null);

    try {
      const response = await api.get(`/verify-registration/${preRegCode.trim()}`);
      
      if (response.data.valid) {
        if (response.data.already_confirmed) {
          setError(`This registration has already been checked in on ${new Date(response.data.confirmed_at).toLocaleString()}`);
          setPreRegData(null);
        } else {
          setPreRegData(response.data);
          setForm(prev => ({
            ...prev,
            first_name: response.data.first_name || "",
            last_name: response.data.last_name || "",
            email: response.data.email || "",
            phone: response.data.phone || "",
            address: response.data.address || "",
            company_name: response.data.company_name || "",
            designation: response.data.designation || "",
            age_range: response.data.age_range || "",
            gender: response.data.gender || "",
            gender_other: response.data.gender_other || "",
            industry_sector: response.data.industry_sector || "",
            industry_sector_other: response.data.industry_sector_other || "",
            reason_for_attending: response.data.reason_for_attending || "",
            reason_for_attending_other: response.data.reason_for_attending_other || "",
            specific_areas_of_interest: response.data.specific_areas_of_interest || "",
            specific_areas_of_interest_other: response.data.specific_areas_of_interest_other || "",
            how_did_you_learn_about: response.data.how_did_you_learn_about || "",
            how_did_you_learn_about_other: response.data.how_did_you_learn_about_other || "",
            payment_status: response.data.payment_status || "unpaid",
            registration_type: response.data.registration_type || form.registration_type,
          }));
          
          setShowOtherFields({
            gender: response.data.gender === "Others",
            industry: response.data.industry_sector === "Others",
            reason: response.data.reason_for_attending === "Others",
            interest: response.data.specific_areas_of_interest === "Others",
            learn: response.data.how_did_you_learn_about === "Others"
          });

          if (response.data.email) {
            validateEmail(response.data.email);
          }

          setSuccess("✅ Registration verified! Please review and confirm your details below.");
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Verification failed. Please check your code.";
      setError(errorMsg);
      setPreRegData(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

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

  // ✅ NEW: Function to handle badge printing after registration
  const handlePrintBadge = async (ticketNumber) => {
    try {
      // Call the scan endpoint to mark as scanned
      await api.post(`/registrations/${ticketNumber}/scan`);
      
      // Open badge print page in new window
      const badgeUrl = `/print-badge/${ticketNumber}`;
      const printWin = window.open(badgeUrl, "_blank");
      
      if (printWin) {
        printWin.focus();
      } else {
        // Fallback if popup was blocked
        window.open(badgeUrl, "_blank");
      }
    } catch (err) {
      console.error("Badge print error:", err);
      // Even if scan fails, still try to open the badge page
      const badgeUrl = `/print-badge/${ticketNumber}`;
      window.open(badgeUrl, "_blank");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validate required fields
    if (!form.first_name.trim()) {
      setError("❌ First Name is required");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!form.last_name.trim()) {
      setError("❌ Last Name is required");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!form.company_name.trim()) {
      setError("❌ Company/Organization Name is required");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // ✅ Validate email if provided
    if (form.email.trim() && !validateEmail(form.email)) {
      setError("❌ Please provide a valid email address or leave the field empty.");
      document.querySelector('input[name="email"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // ✅ Check confirmation checkbox
    if (!confirmed) {
      setError("⚠️ Please confirm that all information provided is correct before submitting.");
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await api.post("/registrations", form);
      
      const registration = res.data.registration;
      const successMessage = isPreRegistered 
        ? `✅ Pre-registered attendee confirmed successfully!\n\n📋 Ticket: ${registration.ticket_number}\n👤 Name: ${registration.first_name} ${registration.last_name}`
        : isComplimentary
        ? `✅ Complimentary registration confirmed!\n\n📋 Ticket: ${registration.ticket_number}\n👤 Name: ${registration.first_name} ${registration.last_name}`
        : `✅ Registration successful!\n\n📋 Ticket Number: ${registration.ticket_number}\n👤 Name: ${registration.first_name} ${registration.last_name}\n🏢 Company: ${registration.company_name}`;
      
      setSuccess(successMessage);
      
      // ✅ NEW: Print badge after successful registration
      // Wait a moment for the success message to be visible, then open badge print page
      setTimeout(() => {
        handlePrintBadge(registration.ticket_number);
      }, 1000);
      
      // Reset form
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        company_name: "",
        designation: "",
        age_range: "",
        gender: "",
        gender_other: "",
        industry_sector: "",
        industry_sector_other: "",
        reason_for_attending: "",
        reason_for_attending_other: "",
        specific_areas_of_interest: "",
        specific_areas_of_interest_other: "",
        how_did_you_learn_about: "",
        how_did_you_learn_about_other: "",
        registration_type: "onsite",
        payment_status: "unpaid",
      });
      
      setConfirmed(false);
      setEmailError("");
      setPreRegCode("");
      setPreRegData(null);
      setShowOtherFields({
        gender: false,
        industry: false,
        reason: false,
        interest: false,
        learn: false
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err) {
      const status = err.response?.status;
      const errorData = err.response?.data;
      
      if (status === 409) {
        setError(`❌ ${errorData.error || 'This person is already registered.'}\n\nPlease verify the name or contact support.`);
      } else if (status === 422 && errorData.errors?.email) {
        setError(`❌ ${errorData.errors.email[0]}`);
        setEmailError(errorData.errors.email[0]);
        document.querySelector('input[name="email"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setError(errorData?.message || errorData?.error || "Registration failed. Please try again.");
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 10 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Reset pre-reg data when changing registration type
  useEffect(() => {
    if (form.registration_type !== "pre-registered" && form.registration_type !== "complimentary") {
      setPreRegCode("");
      setPreRegData(null);
    }
  }, [form.registration_type]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {isPreRegistered ? "🎫 Pre-Registration Check-In" : 
           isComplimentary ? "🎁 Complimentary Registration" : 
           "➕ Registration Form - ICEGEX 2025"}
        </h2>

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            <div style={{ whiteSpace: 'pre-line' }}>{error}</div>
            <button onClick={() => setError(null)} style={styles.closeBtn}>✕</button>
          </div>
        )}
        
        {/* Success Display */}
        {success && (
          <div style={styles.successBox}>
            <div style={{ whiteSpace: 'pre-line' }}>{success}</div>
            <div style={{ marginTop: '10px', fontSize: '0.9rem', fontStyle: 'italic' }}>
              🖨️ Opening badge print page...
            </div>
            <button onClick={() => setSuccess(null)} style={styles.closeBtn}>✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* Registration Type Selector */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📋 Registration Type</h3>
            <label style={styles.label}>
              <span style={styles.labelText}>Select Registration Type: <span style={{ color: 'red' }}>*</span></span>
              <select
                name="registration_type"
                value={form.registration_type}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="onsite">Onsite</option>
                <option value="online">Online</option>
                <option value="pre-registered">Pre-Registered</option>
                <option value="complimentary">Complimentary</option>
              </select>
            </label>
          </div>

          {/* Pre-Registration OR Complimentary Verification */}
          {(isPreRegistered || isComplimentary) && !preRegData && (
            <div style={styles.preRegSection}>
              <h3 style={styles.sectionTitle}>
                {isComplimentary ? "🎁 Verify Complimentary Code" : "🔍 Verify Pre-Registration"}
              </h3>
              <p style={styles.helpText}>
                {isComplimentary 
                  ? "Enter your complimentary access code to auto-fill your details:"
                  : "Enter your pre-registration code (ticket number) to auto-fill your details:"}
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <label style={{ ...styles.label, flex: 1, minWidth: '250px' }}>
                  <span style={styles.labelText}>
                    {isComplimentary ? "Complimentary Code:" : "Pre-Registration Code:"}
                  </span>
                  <input
                    type="text"
                    value={preRegCode}
                    onChange={(e) => setPreRegCode(e.target.value.toUpperCase())}
                    placeholder="TICKET-XXXXXXXXXXXX"
                    style={styles.input}
                    disabled={verifying}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleVerifyPreReg}
                  disabled={verifying || !preRegCode.trim()}
                  style={{
                    ...styles.btnPrimary,
                    opacity: (verifying || !preRegCode.trim()) ? 0.5 : 1,
                    cursor: (verifying || !preRegCode.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {verifying ? "Verifying..." : "Verify Code"}
                </button>
              </div>
              <p style={{ ...styles.helpText, marginTop: '10px', marginBottom: 0 }}>
                Or fill out the form manually below ↓
              </p>
            </div>
          )}

          {/* Verified Banner */}
          {(isPreRegistered || isComplimentary) && preRegData && (
            <div style={styles.verifiedBanner}>
              ✅ {isComplimentary ? "Complimentary access" : "Pre-registration"} verified for: <strong>{preRegData.first_name} {preRegData.last_name}</strong>
              <br />
              <small>Please review and update your information below if needed</small>
            </div>
          )}

          <div style={styles.divider}></div>

          {/* SECTION 1: Personal Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👤 Personal Information</h3>
            
            <div style={styles.row}>
              <label style={{ ...styles.label, flex: 1 }}>
                <span style={styles.labelText}>First Name: <span style={{ color: 'red' }}>*</span></span>
                <input
                  name="first_name"
                  placeholder="John"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </label>
              <label style={{ ...styles.label, flex: 1 }}>
                <span style={styles.labelText}>Last Name: <span style={{ color: 'red' }}>*</span></span>
                <input
                  name="last_name"
                  placeholder="Doe"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </label>
            </div>

            {/* Email Field with Validation */}
            <label style={styles.label}>
              <span style={styles.labelText}>Email Address:</span>
              <input
                type="email"
                name="email"
                placeholder="john.doe@example.com (optional)"
                value={form.email}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(emailError ? { borderColor: '#dc3545', borderWidth: '2px' } : {})
                }}
              />
              {emailError && (
                <span style={styles.fieldError}>
                  {emailError}
                </span>
              )}
              {!emailError && form.email.trim() && (
                <span style={styles.fieldSuccess}>
                  ✓ Valid email format
                </span>
              )}
            </label>

            <div style={styles.row}>
              <label style={{ ...styles.label, flex: 1 }}>
                <span style={styles.labelText}>Phone Number:</span>
                <input
                  name="phone"
                  placeholder="+63 912 345 6789 (optional)"
                  value={form.phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </label>
              <label style={{ ...styles.label, flex: 1 }}>
                <span style={styles.labelText}>Address:</span>
                <input
                  name="address"
                  placeholder="City, Country (optional)"
                  value={form.address}
                  onChange={handleChange}
                  style={styles.input}
                />
              </label>
            </div>

            <label style={styles.label}>
              <span style={styles.labelText}>Company/Organization: <span style={{ color: 'red' }}>*</span></span>
              <input
                name="company_name"
                placeholder="Company Name"
                value={form.company_name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Designation/Job Title:</span>
              <input
                name="designation"
                placeholder="e.g., Manager, Owner, Student (optional)"
                value={form.designation}
                onChange={handleChange}
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Payment Status: <span style={{ color: 'red' }}>*</span></span>
              <select
                name="payment_status"
                value={form.payment_status}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="complimentary">Complimentary</option>
              </select>
            </label>
          </div>

          <div style={styles.divider}></div>

          {/* SECTION 2: Demographics (Optional) */}
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>📊 Demographics</h3>
              <span style={styles.optionalBadge}>Optional</span>
            </div>
            <p style={styles.helpText}>
              This information helps us understand our attendees better and improve future events.
            </p>

            <label style={styles.label}>
              <span style={styles.labelText}>Age Range:</span>
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
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Gender:</span>
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
            </label>

            {showOtherFields.gender && (
              <label style={styles.label}>
                <span style={styles.labelText}>Please specify:</span>
                <input
                  name="gender_other"
                  placeholder="Please specify your gender"
                  value={form.gender_other}
                  onChange={handleChange}
                  style={styles.input}
                />
              </label>
            )}
          </div>

          <div style={styles.divider}></div>

          {/* SECTION 3: Event Survey (Optional) */}
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>📝 Event Survey - ICEGEX 2025</h3>
              <span style={styles.optionalBadge}>Optional</span>
            </div>
            <p style={styles.helpText}>
              Help us serve you better! Your responses will help us tailor the event to your interests.
            </p>

            {/* Industry Sector */}
            <label style={styles.label}>
              <span style={styles.labelText}>Industry Sector:</span>
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
            </label>

            {showOtherFields.industry && (
              <label style={styles.label}>
                <span style={styles.labelText}>Please specify your industry:</span>
                <input
                  name="industry_sector_other"
                  placeholder="Your industry sector"
                  value={form.industry_sector_other}
                  onChange={handleChange}
                  style={styles.input}
                />
              </label>
            )}

            {/* Reason for Attending */}
            <label style={styles.label}>
              <span style={styles.labelText}>Reason for Attending ICEGEX 2025:</span>
              <select
                name="reason_for_attending"
                value={form.reason_for_attending}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">-- Select Reason --</option>
                <option value="Discover new ice cream, gelato, or soft serve products">Discover new ice cream, gelato, or soft serve products</option>
                <option value="Source ingredients, equipment, or packaging">Source ingredients, equipment, or packaging</option>
                <option value="Learn from demos, talks, or competitions">Learn from demos, talks, or competitions</option>
                <option value="Explore franchise or business opportunities">Explore franchise or business opportunities</option>
                <option value="Meet potential partners or suppliers">Meet potential partners or suppliers</option>
                <option value="Scout the event for future participation">Scout the event for future participation</option>
                <option value="Others">Others</option>
              </select>
            </label>

            {showOtherFields.reason && (
              <label style={styles.label}>
                <span style={styles.labelText}>Please specify your reason:</span>
                <textarea
                  name="reason_for_attending_other"
                  placeholder="Your reason for attending"
                  value={form.reason_for_attending_other}
                  onChange={handleChange}
                  style={styles.textarea}
                  rows={3}
                />
              </label>
            )}

            {/* Areas of Interest */}
            <label style={styles.label}>
              <span style={styles.labelText}>Specific Areas of Interest:</span>
              <select
                name="specific_areas_of_interest"
                value={form.specific_areas_of_interest}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">-- Select Area of Interest --</option>
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
            </label>

            {showOtherFields.interest && (
              <label style={styles.label}>
                <span style={styles.labelText}>Please specify your interests:</span>
                <textarea
                  name="specific_areas_of_interest_other"
                  placeholder="Your specific interests"
                  value={form.specific_areas_of_interest_other}
                  onChange={handleChange}
                  style={styles.textarea}
                  rows={3}
                />
              </label>
            )}

            {/* How did you learn */}
            <label style={styles.label}>
              <span style={styles.labelText}>How did you learn about ICEGEX 2025?</span>
              <select
                name="how_did_you_learn_about"
                value={form.how_did_you_learn_about}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">-- Select Source --</option>
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
            </label>

            {showOtherFields.learn && (
              <label style={styles.label}>
                <span style={styles.labelText}>Please specify:</span>
                <textarea
                  name="how_did_you_learn_about_other"
                  placeholder="How you learned about us"
                  value={form.how_did_you_learn_about_other}
                  onChange={handleChange}
                  style={styles.textarea}
                  rows={2}
                />
              </label>
            )}
          </div>

          <div style={styles.divider}></div>

          {/* ✅ CONFIRMATION SECTION */}
          <div style={styles.confirmationSection}>
            <h3 style={styles.sectionTitle}>✅ Confirmation</h3>
            
            <div style={styles.summaryBox}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#495057' }}>
                📋 Registration Summary
              </h4>
              <div style={styles.summaryRow}>
                <strong>Name:</strong> {form.first_name || '(not filled)'} {form.last_name || '(not filled)'}
              </div>
              <div style={styles.summaryRow}>
                <strong>Email:</strong> {form.email || '(not provided)'}
              </div>
              <div style={styles.summaryRow}>
                <strong>Company:</strong> {form.company_name || '(not filled)'}
              </div>
              <div style={styles.summaryRow}>
                <strong>Registration Type:</strong> <span style={{ textTransform: 'uppercase' }}>{form.registration_type}</span>
              </div>
              <div style={styles.summaryRow}>
                <strong>Payment Status:</strong> <span style={{ textTransform: 'uppercase' }}>{form.payment_status}</span>
              </div>
            </div>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={styles.checkbox}
              />
              <span>
                <strong>I confirm that all information provided above is correct and accurate.</strong>
                <br />
                <small style={{ color: '#6c757d' }}>
                  Please review all sections before submitting. You can scroll up to make any changes.
                </small>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div style={styles.submitSection}>
            <button
              type="submit"
              disabled={loading || !confirmed || !!emailError}
              style={{
                ...styles.btnSubmit,
                opacity: (loading || !confirmed || !!emailError) ? 0.5 : 1,
                cursor: (loading || !confirmed || !!emailError) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? "⏳ Processing Registration..." : "✓ Submit Registration"}
            </button>
            
            {!confirmed && !emailError && (
              <p style={{ textAlign: 'center', color: '#dc3545', fontSize: '0.9rem', marginTop: '10px' }}>
                ⚠️ Please check the confirmation box above to submit
              </p>
            )}
            
            {emailError && (
              <p style={{ textAlign: 'center', color: '#dc3545', fontSize: '0.9rem', marginTop: '10px' }}>
                ⚠️ Please fix the email error above before submitting
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ✅ Styles
const styles = {
  container: {
    padding: "20px",
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    padding: "40px",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "30px",
    color: "#333",
    textAlign: "center",
    borderBottom: "3px solid #007bff",
    paddingBottom: "20px",
  },
  errorBox: {
    padding: "15px",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #f5c6cb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  successBox: {
    padding: "15px",
    backgroundColor: "#d4edda",
    color: "#155724",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #c3e6cb",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    marginLeft: "10px",
    padding: "0 5px",
    color: "inherit",
    alignSelf: "flex-start",
  },
  preRegSection: {
    padding: "25px",
    backgroundColor: "#e7f3ff",
    borderRadius: "8px",
    marginBottom: "30px",
    border: "2px solid #007bff",
  },
  verifiedBanner: {
    padding: "20px",
    backgroundColor: "#d4edda",
    color: "#155724",
    borderRadius: "8px",
    marginBottom: "30px",
    border: "2px solid #28a745",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "1.05rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  section: {
    marginBottom: "10px",
  },
  sectionTitle: {
    fontSize: "1.4rem",
    color: "#007bff",
    marginBottom: "20px",
    paddingBottom: "10px",
    borderBottom: "2px solid #e9ecef",
  },
  optionalBadge: {
    padding: "4px 12px",
    backgroundColor: "#28a745",
    color: "white",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  helpText: {
    fontSize: "0.9rem",
    color: "#6c757d",
    marginBottom: "20px",
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    borderLeft: "4px solid #17a2b8",
  },
  divider: {
    height: "2px",
    backgroundColor: "#e9ecef",
    margin: "20px 0",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  },
  labelText: {
    fontSize: "1rem",
    color: "#495057",
    fontWeight: "600",
  },
  row: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
  input: {
    padding: "12px 15px",
    border: "1px solid #ced4da",
    borderRadius: "6px",
    fontSize: "1rem",
    transition: "all 0.3s",
    outline: "none",
  },
  select: {
    padding: "12px 15px",
    border: "1px solid #ced4da",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.3s",
    outline: "none",
  },
  textarea: {
    padding: "12px 15px",
    border: "1px solid #ced4da",
    borderRadius: "6px",
    fontSize: "1rem",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
    outline: "none",
  },
  fieldError: {
    color: "#dc3545",
    fontSize: "0.875rem",
    fontWeight: "600",
    marginTop: "-4px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  fieldSuccess: {
    color: "#28a745",
    fontSize: "0.875rem",
    fontWeight: "600",
    marginTop: "-4px",
  },
  confirmationSection: {
    padding: "30px",
    backgroundColor: "#fff3cd",
    borderRadius: "8px",
    border: "2px solid #ffc107",
  },
  summaryBox: {
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "6px",
    marginBottom: "20px",
    border: "1px solid #dee2e6",
  },
  summaryRow: {
    padding: "8px 0",
    borderBottom: "1px solid #e9ecef",
    fontSize: "0.95rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    fontSize: "1rem",
    cursor: "pointer",
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "2px solid #dee2e6",
    transition: "all 0.3s",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    marginTop: "2px",
    cursor: "pointer",
  },
  submitSection: {
    textAlign: "center",
    paddingTop: "20px",
  },
  btnSubmit: {
    padding: "18px 40px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.2rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(40,167,69,0.3)",
    width: "100%",
    maxWidth: "400px",
  },
  btnPrimary: {
    padding: "12px 24px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s",
  },
};