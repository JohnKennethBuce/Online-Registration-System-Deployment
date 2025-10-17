/**
 * ===========================================================
 * 🧾 OnlineRegistrationPage.jsx
 * ===========================================================
 * 🔹 Author: John Kenneth Buce
 * 🔹 Purpose: Handles event registration, QR generation, and display
 * 🔹 Connected API: Django/Laravel backend via Axios (`/api/registrations`)
 *
 * ===========================================================
 * 📘 MAIN FEATURES
 * ===========================================================
 * 1️⃣ Live Online Registration Form
 *     - Collects user information and submits to backend.
 *     - Prevents duplicate registration by email (server-side).
 *
 * 2️⃣ QR Code Generation & Auto Polling
 *     - Polls backend until QR is available (~15 seconds max).
 *     - Displays QR image once available.
 *     - Allows retry if QR fails to load.
 *
 * 3️⃣ Local Device Lock (Security)
 *     - Prevents same browser/device from re-registering.
 *     - Stores last registration data + QR.
 *     - Automatically restores QR and info on page reload.
 *
 * 4️⃣ Auto Fade-Out & Auto Close
 *     - After showing success screen for ~10s, fades out.
 *     - Protects page from re-registering (locked mode).
 *
 * 5️⃣ Safe Developer Tools
 *     - Includes `localStorage` reset key combo:
 *         👉 Press `Ctrl + Alt + R` to unlock form (for testing).
 *
 * ===========================================================
 * 🧠 HOW TO RESET THE DEVICE LOCK (for testing/dev only)
 * ===========================================================
 *  → Open this page, then press `Ctrl + Alt + R`
 *    ✅ It will clear all saved registration info.
 * ===========================================================
 */

import { useEffect, useState, useRef } from "react";
import api from "../api/axios";

export default function OnlineRegistrationPage() {
  const [serverMode, setServerMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [settings, setSettings] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;

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

  /** 🕒 Auto-close success after fade */
  useEffect(() => {
    if (successfulReg) {
      const fadeTimer = setTimeout(() => setFadeOut(true), 8000); // start fade after 8s
      const closeTimer = setTimeout(() => window.close(), 30000); // close after 30s
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [successfulReg]);

  // 🌀 UI States
  if (loading) return <h2 style={{ padding: "20px" }}>Loading...</h2>;
  if (preparingQr)
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <h2>Preparing your QR code…</h2>
        <p>Please wait while we generate your QR.</p>
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
          padding: "20px",
          textAlign: "center",
          maxWidth: "500px",
          margin: "auto",
          opacity: fadeOut ? 0 : 1,
          transition: "opacity 1.2s ease-in-out",
        }}
      >
        <h2>✅ Registration Successful!</h2>
        <p>Please save your QR Code for event check-in.</p>

        {qrUrl ? (
          <img
            src={qrUrl}
            alt="Your QR Code"
            onError={() => setTimeout(refreshQr, 800)}
            style={{
              border: "1px solid black",
              padding: "10px",
              maxWidth: "300px",
              width: "100%",
            }}
          />
        ) : (
          <div style={{ margin: "20px 0" }}>
            <p style={{ marginBottom: 8 }}>Your QR is being generated…</p>
            <button onClick={refreshQr}>🔄 Try again</button>
          </div>
        )}

        <h3 style={{ marginTop: 12 }}>
          {successfulReg.first_name} {successfulReg.last_name}
        </h3>
        <p>Ticket Number: {successfulReg.ticket_number}</p>
        <p style={{ marginTop: 16, color: "#555" }}>
          This device is now restricted from submitting another registration.
        </p>
      </div>
    );
  }

  if (serverMode !== "online" && serverMode !== "both") {
    return (
      <h2 style={{ padding: "20px" }}>
        Online registration is currently closed.
      </h2>
    );
  }

  if (locked && !successfulReg) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Access Restricted</h2>
        <p>This device has already completed registration.</p>
        <p>
          Press <strong>Ctrl + Alt + R</strong> to reset (admin only).
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h1>Online Registration</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <input
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="First Name"
          required
        />
        <input
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="Last Name"
          required
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email Address"
          type="email"
          required
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone (optional)"
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address (optional)"
        />
        <input
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          placeholder="Company Name (optional)"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ padding: "10px", fontWeight: "bold" }}
        >
          {isSubmitting ? "Processing..." : "Register"}
        </button>
      </form>
    </div>
  );
}
