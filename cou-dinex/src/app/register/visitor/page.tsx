"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

export default function VisitorRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = React.useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!formData.fullName.trim()) {
      setError("Please enter your Full Name.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your Email Address.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Please enter your Phone Number.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long with letters and numbers.");
      return;
    }
    if (!formData.agreedToTerms) {
      setError("You must agree to the terms to proceed.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        }
        setError(data.error || "Registration failed. Please check the form.");
        setSubmitting(false);
        return;
      }

      // Success — redirect to home
      router.push("/home");
      router.refresh();
    } catch {
      setError("Unable to connect to server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "36px 16px",
        background: "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 60%, #F1F5F9 100%)",
        color: "#0F172A",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)",
            }}
          >
            <UtensilsCrossed size={22} className="text-amber-700" />
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>
            CoU <span style={{ color: "#0F766E" }}>Dine</span>
            <span style={{ color: "#F59E0B" }}>X</span>
          </span>
        </Link>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              background: "#FEF3C7",
              color: "#B45309",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <User size={14} /> Guest & Visitor Access
          </span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px 0", color: "#0F172A" }}>
          Create Visitor Account
        </h1>
        <p style={{ color: "#64748B", fontSize: 13, margin: 0, maxWidth: 420 }}>
          Order cafeteria food directly for takeaway pickup or table dining
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 24,
          padding: "32px 30px",
          boxShadow: "0 10px 30px rgba(15, 118, 110, 0.08)",
        }}
      >
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#FEE2E2",
              border: "1px solid #FECACA",
              color: "#DC2626",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Full Name */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Full Name <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  display: "flex",
                }}
              >
                <User size={18} />
              </span>
              <input
                type="text"
                name="fullName"
                id="visitor-fullname-input"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Asif Rahman"
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 42px",
                  background: "#F8FAFC",
                  border: fieldErrors.fullName ? "1px solid #DC2626" : "1px solid #CBD5E1",
                  borderRadius: 12,
                  color: "#0F172A",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                onBlur={(e) =>
                  (e.target.style.borderColor = fieldErrors.fullName ? "#DC2626" : "#CBD5E1")
                }
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Email Address <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  display: "flex",
                }}
              >
                <Mail size={18} />
              </span>
              <input
                type="email"
                name="email"
                id="visitor-email-input"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="asif@example.com"
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 42px",
                  background: "#F8FAFC",
                  border: fieldErrors.email ? "1px solid #DC2626" : "1px solid #CBD5E1",
                  borderRadius: 12,
                  color: "#0F172A",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                onBlur={(e) =>
                  (e.target.style.borderColor = fieldErrors.email ? "#DC2626" : "#CBD5E1")
                }
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Phone Number <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  display: "flex",
                }}
              >
                <Phone size={18} />
              </span>
              <input
                type="tel"
                name="phone"
                id="visitor-phone-input"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+880 1XXXXXXXXX"
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 42px",
                  background: "#F8FAFC",
                  border: fieldErrors.phone ? "1px solid #DC2626" : "1px solid #CBD5E1",
                  borderRadius: 12,
                  color: "#0F172A",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                onBlur={(e) =>
                  (e.target.style.borderColor = fieldErrors.phone ? "#DC2626" : "#CBD5E1")
                }
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: 6,
                }}
              >
                Password <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
                    display: "flex",
                  }}
                >
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="visitor-password-input"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars"
                  style={{
                    width: "100%",
                    padding: "11px 38px 11px 42px",
                    background: "#F8FAFC",
                    border: fieldErrors.password ? "1px solid #DC2626" : "1px solid #CBD5E1",
                    borderRadius: 12,
                    color: "#0F172A",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = fieldErrors.password ? "#DC2626" : "#CBD5E1")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: 6,
                }}
              >
                Confirm <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
                    display: "flex",
                  }}
                >
                  <Lock size={18} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="visitor-confirm-password-input"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat"
                  style={{
                    width: "100%",
                    padding: "11px 38px 11px 42px",
                    background: "#F8FAFC",
                    border: "1px solid #CBD5E1",
                    borderRadius: 12,
                    color: "#0F172A",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                  onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  aria-label="Toggle confirm password"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Terms checkbox */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginTop: 4,
              padding: "6px 0",
            }}
          >
            <input
              type="checkbox"
              id="visitor-terms-checkbox"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleChange}
              style={{
                marginTop: 3,
                width: 17,
                height: 17,
                accentColor: "#0F766E",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="visitor-terms-checkbox"
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.4,
                cursor: "pointer",
              }}
            >
              I agree to <strong>CoU DineX Dining Terms</strong> for cafeteria pickup and guest food orders.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="visitor-submit-btn"
            disabled={submitting}
            style={{
              marginTop: 6,
              padding: "13px 20px",
              borderRadius: 12,
              border: "none",
              background: submitting ? "#94A3B8" : "#0F766E",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = "#115E59";
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = "#0F766E";
            }}
          >
            {submitting ? "Creating Account..." : "Create Visitor Account"}
            {!submitting && <ArrowRight size={17} />}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid #E2E8F0",
            textAlign: "center",
            fontSize: 13,
            color: "#64748B",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "#0F766E",
              fontWeight: 700,
              textDecoration: "none",
              marginLeft: 4,
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
