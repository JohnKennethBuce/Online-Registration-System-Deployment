import React from "react";
import api from "../api/axios";

export default function BadgePrint({ settings, registration, showQr = false }) {
  const backendUrl = api.defaults.baseURL.replace("/api", "");

  const getImageUrl = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const clean = String(path).replace(/\\/g, "/").replace(/^\/?storage\/?/i, "");
    return `${backendUrl}/storage/${clean}`;
  };

  const mainLogo = getImageUrl(settings.main_logo_path);
  const orgLogo = getImageUrl(settings.organizer_logo_path);
  const mgrLogo = getImageUrl(settings.manager_logo_path);
  const regLogo = getImageUrl(settings.registration_logo_path);
  const qrUrl = registration?.qr_code_path
    ? getImageUrl(registration.qr_code_path)
    : "https://api.qrserver.com/v1/create-qr-code/?data=sample&size=80x80";

  return (
  <div
  style={{
    width: "7.5cm", // Default width; adjust this value as needed
    height: "7.5cm", // Default height; adjust this value as needed
    paddingTop: "10px",    // Default top padding; adjust this value as needed
    paddingRight: "5px",  // Default right padding; adjust this value as needed
    paddingBottom: "120px", // Default bottom padding; adjust this value as needed
    paddingLeft: "40px",   // Default left padding; adjust this value as needed
    boxSizing: "border-box", // Ensure padding is included in the total width/height
    background: "#fff", // White background for printing
    color: "#111", // Dark text for readability
    display: "flex", // Use flexbox for layout
    flexDirection: "column", // Stack children vertically
    justifyContent: "space-between", // Space out header, content, and footer
    fontFamily: "Instrument Sans, sans-serif", // Use the custom font
    border: "1px solid #ccc", // Light border for badge outline
    position: "relative", // For any absolute positioning inside
    overflow: "visible", // Ensure content isn't clipped
  }}
>
      {/* HEADER */} 
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "3px" }}> 
        {mainLogo && (
          <img src={mainLogo} alt="Main Logo" style={{ maxWidth: "60px", maxHeight: "50px" }} /> 
        )}
        <div style={{ textAlign: "left", fontSize: "12px", lineHeight: "1.2" }}>  
          <div>{settings.event_location || "Event Location"}</div> 
          <div>{settings.event_datetime || "Event Date & Time"}</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ textAlign: "center", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
        <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "1px" }}> 
          {registration.first_name || registration.firstName}{" "}
          {registration.last_name || registration.lastName}
        </div>
        <div
          style={{
            fontSize: "11px", 
            borderBottom: "1px solid #000", 
            paddingBottom: "2px", 
            marginBottom: "2px", 
            textAlign: "center",
          }}
        >
          {registration.company_name || registration.companyName || "N/A"}
        </div>
        <div style={{ fontSize: "12px", fontWeight: "700", marginBottom: "3px" }}> 
          {settings.event_name || "EVENT NAME"}
        </div>
        {showQr && (
          <img src={qrUrl} alt="QR Code" style={{ width: "60px", height: "60px", margin: "auto" }} /> // Reduced QR size if used
        )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: "7px", 
          paddingTop: "2px", 
        }}
      >
        <div>
          <strong>Organized By:</strong><br />
          {orgLogo && <img src={orgLogo} alt="Organizer" style={{ maxHeight: "20px" }} />} 
        </div>
        <div>
          <strong>Event Manager:</strong><br />
          {mgrLogo && <img src={mgrLogo} alt="Manager" style={{ maxHeight: "20px" }} />}
        </div>
        <div>
          <strong>Registration:</strong><br />
          {regLogo && <img src={regLogo} alt="Registration" style={{ maxHeight: "20px" }} />}
        </div>
      </div>
    </div>
  );
}