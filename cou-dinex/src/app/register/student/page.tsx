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
  Hash,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  ShieldAlert,
  GraduationCap,
  UtensilsCrossed,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
}

const SESSIONS = [
  "2023-2024",
  "2022-2023",
  "2021-2022",
  "2020-2021",
  "2019-2020",
  "2018-2019",
];

export default function StudentRegisterPage() {
  const router = useRouter();

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = React.useState(true);

  const [formData, setFormData] = React.useState({
    universityStudentId: "",
    fullName: "",
    departmentId: "",
    session: "2022-2023",
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
  const [successNotice, setSuccessNotice] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState("");
  const [registeredId, setRegisteredId] = React.useState("");

  // Fetch departments from database
  React.useEffect(() => {
    async function loadDepts() {
      try {
        const res = await fetch("/api/departments");
        const data = await res.json();
        if (data.departments && data.departments.length > 0) {
          setDepartments(data.departments);
          setFormData((prev) => ({ ...prev, departmentId: data.departments[0].id }));
        }
      } catch (err) {
        console.error("Failed to load departments", err);
      } finally {
        setLoadingDepts(false);
      }
    }
    loadDepts();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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

    if (!formData.universityStudentId.trim()) {
      setError("Please enter your University ID.");
      return;
    }
    if (!formData.fullName.trim()) {
      setError("Please enter your Full Name.");
      return;
    }
    if (!formData.departmentId) {
      setError("Please select your Department.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your University Email.");
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
      setError("You must agree to the CoU DineX Terms to proceed.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          universityStudentId: formData.universityStudentId,
          departmentId: formData.departmentId,
          session: formData.session,
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
        setError(data.error || "Registration failed. Please check your information.");
        setSubmitting(false);
        return;
      }

      // Success — show exact SRS Post-Registration Verification Card
      setRegisteredEmail(formData.email);
      setRegisteredId(formData.universityStudentId);
      setSuccessNotice(true);
    } catch {
      setError("Unable to connect to server. Please try again.");
      setSubmitting(false);
    }
  }

  // Exact SRS Post-Registration Verification Card
  if (successNotice) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px 16px",
          background: "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 60%, #F1F5F9 100%)",
          fontFamily: "var(--font-sans), sans-serif",
          color: "#0F172A",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 24,
            padding: "36px 32px",
            boxShadow: "0 12px 36px rgba(15, 118, 110, 0.12)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#CCFBF1",
                color: "#0F766E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <GraduationCap size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px 0", color: "#0F172A" }}>
              Student Verification
            </h2>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
              CoU Campus Dining & Identification
            </p>
          </div>

          {/* Verification checklist from SRS */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                University ID ({registeredId})
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#16A34A",
                }}
              >
                <CheckCircle2 size={15} /> Received
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                University Email
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#16A34A",
                }}
              >
                <CheckCircle2 size={15} /> Verification Sent
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 10,
                borderTop: "1px dashed #CBD5E1",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                Student Approval
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: "#FEF3C7",
                  color: "#B45309",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Clock size={14} /> Pending
              </span>
            </div>
          </div>

          {/* Exact SRS Quote Box */}
          <div
            style={{
              background: "#F0FDFA",
              border: "1px solid #CCFBF1",
              borderRadius: 14,
              padding: "16px 18px",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "#0F766E",
                margin: 0,
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              &ldquo;Your account will be verified by university admin. Meanwhile you can browse menus and order at standard prices.&rdquo;
            </p>
          </div>

          <button
            id="reg-verif-continue-btn"
            onClick={() => router.push("/verify-email")}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
              color: "#FFFFFF",
              border: "none",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(15, 118, 110, 0.25)",
            }}
          >
            <span>Proceed to Email Verification</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Registration Form in Exact SRS Order
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 16px",
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
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#CCFBF1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(15, 118, 110, 0.15)",
            }}
          >
            <UtensilsCrossed size={22} className="text-teal-700" />
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>
            CoU <span style={{ color: "#0F766E" }}>Dine</span>
            <span style={{ color: "#F59E0B" }}>X</span>
          </span>
        </Link>

        {/* SRS Badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              background: "#CCFBF1",
              color: "#0F766E",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <GraduationCap size={15} /> Student Registration
          </span>
        </div>

        {/* SRS Exact Title & Subtitle */}
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px 0", color: "#0F172A" }}>
          Create your CoU account
        </h1>
        <p style={{ color: "#64748B", fontSize: 13, margin: 0, maxWidth: 420 }}>
          Exclusively for registered Comilla University students
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 540,
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
          {/* 1. University ID */}
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
              University ID <span style={{ color: "#DC2626" }}>*</span>
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
                <Hash size={18} />
              </span>
              <input
                type="text"
                name="universityStudentId"
                id="university-student-id-input"
                required
                value={formData.universityStudentId}
                onChange={handleChange}
                placeholder="e.g. 11908001"
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 42px",
                  background: "#F8FAFC",
                  border: fieldErrors.universityStudentId
                    ? "1px solid #DC2626"
                    : "1px solid #CBD5E1",
                  borderRadius: 12,
                  color: "#0F172A",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                onBlur={(e) =>
                  (e.target.style.borderColor = fieldErrors.universityStudentId
                    ? "#DC2626"
                    : "#CBD5E1")
                }
              />
            </div>
            {fieldErrors.universityStudentId && (
              <span style={{ fontSize: 12, color: "#DC2626", marginTop: 4, display: "block" }}>
                {fieldErrors.universityStudentId[0]}
              </span>
            )}
          </div>

          {/* 2. Full Name */}
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
                id="fullname-input"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Noman Abdullah"
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
            {fieldErrors.fullName && (
              <span style={{ fontSize: 12, color: "#DC2626", marginTop: 4, display: "block" }}>
                {fieldErrors.fullName[0]}
              </span>
            )}
          </div>

          {/* 3 & 4. Department & Session (Row) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
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
                Department <span style={{ color: "#DC2626" }}>*</span>
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
                  <Building2 size={18} />
                </span>
                <select
                  name="departmentId"
                  id="department-select"
                  value={formData.departmentId}
                  onChange={handleChange}
                  disabled={loadingDepts}
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 42px",
                    background: "#F8FAFC",
                    border: "1px solid #CBD5E1",
                    borderRadius: 12,
                    color: "#0F172A",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                >
                  {loadingDepts ? (
                    <option>Loading departments...</option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))
                  )}
                </select>
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
                Session <span style={{ color: "#DC2626" }}>*</span>
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
                  <Calendar size={18} />
                </span>
                <select
                  name="session"
                  id="session-select"
                  value={formData.session}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 42px",
                    background: "#F8FAFC",
                    border: "1px solid #CBD5E1",
                    borderRadius: 12,
                    color: "#0F172A",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                >
                  {SESSIONS.map((sess) => (
                    <option key={sess} value={sess}>
                      {sess}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 5 & 6. University Email & Phone Number (Row) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
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
                University Email <span style={{ color: "#DC2626" }}>*</span>
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
                  id="email-input"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@cou.ac.bd"
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
              {fieldErrors.email && (
                <span style={{ fontSize: 12, color: "#DC2626", marginTop: 4, display: "block" }}>
                  {fieldErrors.email[0]}
                </span>
              )}
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
                  id="phone-input"
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
              {fieldErrors.phone && (
                <span style={{ fontSize: 12, color: "#DC2626", marginTop: 4, display: "block" }}>
                  {fieldErrors.phone[0]}
                </span>
              )}
            </div>
          </div>

          {/* 7 & 8. Password & Confirm Password (Row) */}
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
                  id="password-input"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars"
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 42px",
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
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span style={{ fontSize: 12, color: "#DC2626", marginTop: 4, display: "block" }}>
                  {fieldErrors.password[0]}
                </span>
              )}
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
                Confirm Password <span style={{ color: "#DC2626" }}>*</span>
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
                  id="confirm-password-input"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 42px",
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
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* 9. Exact SRS Checkbox: ☐ I agree to CoU DineX Terms */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginTop: 4,
              padding: "8px 0",
            }}
          >
            <input
              type="checkbox"
              id="terms-checkbox"
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
              htmlFor="terms-checkbox"
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.4,
                cursor: "pointer",
              }}
            >
              I agree to <strong>CoU DineX Terms & Campus Policies</strong> for student cafeteria ordering and university identification.
            </label>
          </div>

          {/* 10. Submit Button: [ Create Student Account ] */}
          <button
            type="submit"
            id="student-submit-btn"
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
            {submitting ? "Creating Student Account..." : "Create Student Account"}
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
          Already registered?{" "}
          <Link
            href="/login"
            style={{
              color: "#0F766E",
              fontWeight: 700,
              textDecoration: "none",
              marginLeft: 4,
            }}
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
