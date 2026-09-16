"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Building2,
  Hash,
  Calendar,
  User,
  Phone,
  ShieldCheck,
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

export default function StudentVerificationStatusPage() {
  const router = useRouter();

  const [student, setStudent] = React.useState<any>(null);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  // Edit form state
  const [formData, setFormData] = React.useState({
    universityStudentId: "",
    departmentId: "",
    session: "",
    fullName: "",
    phone: "",
  });

  const loadStatus = React.useCallback(async () => {
    setLoading(true);
    try {
      const [resStatus, resDepts] = await Promise.all([
        fetch("/api/student/verification"),
        fetch("/api/departments"),
      ]);

      if (resStatus.status === 401) {
        router.push("/login?callbackUrl=/student/verification-status");
        return;
      }

      const dataStatus = await resStatus.json();
      const dataDepts = await resDepts.json();

      if (dataDepts.departments) {
        setDepartments(dataDepts.departments);
      }

      if (dataStatus.student) {
        setStudent(dataStatus.student);
        setFormData({
          universityStudentId: dataStatus.student.universityStudentId || "",
          departmentId: dataStatus.student.departmentId || "",
          session: dataStatus.student.session || "2022-2023",
          fullName: dataStatus.student.user.fullName || "",
          phone: dataStatus.student.user.phone || "",
        });
      }
    } catch (err) {
      console.error("Failed to load student status:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setUpdating(true);

    try {
      const res = await fetch("/api/student/verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update information.");
        setUpdating(false);
        return;
      }

      setMessage("Your updated information has been submitted. Status is now PENDING review.");
      setIsEditing(false);
      setUpdating(false);
      loadStatus();
    } catch {
      setError("Network error. Please try again.");
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#F8FAFC",
          color: "#64748B",
        }}
      >
        <RefreshCw size={24} className="animate-spin" style={{ marginRight: 10 }} />
        Checking verification status...
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h2 style={{ color: "#DC2626" }}>No student profile found</h2>
        <Link href="/login" style={{ color: "#0F766E", fontWeight: 700 }}>
          Go to Sign In
        </Link>
      </div>
    );
  }

  const isApproved = student.verificationStatus === "APPROVED";
  const isRejected = student.verificationStatus === "REJECTED";
  const isMoreInfo = student.verificationStatus === "MORE_INFO_REQUIRED";
  const isPending = student.verificationStatus === "PENDING";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px 16px",
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
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "#CCFBF1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            <UtensilsCrossed size={22} className="text-teal-700" />
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>
            CoU <span style={{ color: "#0F766E" }}>Dine</span>
            <span style={{ color: "#F59E0B" }}>X</span>
          </span>
        </Link>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 500,
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 24,
          padding: "36px 32px",
          boxShadow: "0 10px 30px rgba(15, 118, 110, 0.08)",
        }}
      >
        {message && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#DCFCE7",
              color: "#166534",
              fontSize: 13,
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {/* CASE 1: APPROVED */}
        {isApproved && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#DCFCE7",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 20,
                background: "#CCFBF1",
                color: "#0F766E",
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              <ShieldCheck size={16} /> ✓ Verified CoU Student
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px 0", color: "#0F172A" }}>
              Welcome, {student.user.fullName}!
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              Your university student credentials ({student.universityStudentId} — {student.department.code}) are verified. Full cafeteria ordering, discounts, and delivery privileges are unlocked.
            </p>

            <button
              onClick={() => router.push("/home")}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: 12,
                border: "none",
                background: "#0F766E",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
              }}
            >
              <span>Enter Student Dashboard</span>
              <ArrowRight size={17} />
            </button>
          </div>
        )}

        {/* CASE 2: PENDING (SRS Wireframe Card) */}
        {isPending && !isEditing && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "#CCFBF1",
                  color: "#0F766E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <GraduationCap size={28} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px 0", color: "#0F172A" }}>
                Student Verification
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                Comilla University Dining ID
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
                  University ID ({student.universityStudentId})
                </span>
                <span style={{ color: "#16A34A", fontSize: 12, fontWeight: 700 }}>
                  ✓ Received
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                  University Email
                </span>
                <span style={{ color: "#16A34A", fontSize: 12, fontWeight: 700 }}>
                  ✓ Received
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
                    padding: "4px 10px",
                    borderRadius: 12,
                    background: "#FEF3C7",
                    color: "#B45309",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Pending
                </span>
              </div>
            </div>

            <div
              style={{
                background: "#F0FDFA",
                border: "1px solid #CCFBF1",
                borderRadius: 14,
                padding: "16px 18px",
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: "#0F766E",
                  fontWeight: 600,
                  lineHeight: 1.5,
                  margin: "0 0 6px 0",
                }}
              >
                “Your account has been created and is waiting for university verification.”
              </p>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Estimated: <strong>Manual Review by Campus Administrator</strong>
              </p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: 10,
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#334155",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Edit Submitted Information
            </button>
          </div>
        )}

        {/* CASE 3: REJECTED or MORE_INFO_REQUIRED */}
        {(isRejected || isMoreInfo) && !isEditing && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background: isRejected ? "#FEE2E2" : "#FEF3C7",
                  color: isRejected ? "#DC2626" : "#B45309",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <AlertCircle size={32} />
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px 0", color: "#0F172A" }}>
                {isRejected ? "Verification Unsuccessful" : "More Information Required"}
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                {isRejected
                  ? "Your student credentials require correction before approval."
                  : "The administrator requested details before activating your account."}
              </p>
            </div>

            {student.rejectionReason && (
              <div
                style={{
                  padding: "16px",
                  borderRadius: 14,
                  background: isRejected ? "#FEE2E2" : "#FEF3C7",
                  border: isRejected ? "1px solid #FECACA" : "1px solid #FDE68A",
                  color: isRejected ? "#991B1B" : "#92400E",
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                <strong>Administrator Remark:</strong>
                <div style={{ marginTop: 4 }}>{student.rejectionReason}</div>
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: 12,
                border: "none",
                background: "#0F766E",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
              }}
            >
              <span>Update Information & Request Review</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* CORRECTION FORM (For Rejected / More Info / Pending update) */}
        {isEditing && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px 0", color: "#0F172A" }}>
                Update Registration Credentials
              </h3>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Correct your details to resubmit for campus administrative review.
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#FEE2E2",
                  color: "#DC2626",
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
                  University Student ID *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                    <Hash size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.universityStudentId}
                    onChange={(e) => setFormData({ ...formData, universityStudentId: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      borderRadius: 10,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
                  Full Name *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      borderRadius: 10,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
                  Department *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                    <Building2 size={16} />
                  </span>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      borderRadius: 10,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
                  Academic Session *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                    <Calendar size={16} />
                  </span>
                  <select
                    value={formData.session}
                    onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      borderRadius: 10,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={updating}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "#0F766E",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: updating ? "not-allowed" : "pointer",
                  }}
                >
                  {updating ? "Resubmitting..." : "Resubmit for Review"}
                </button>
              </div>
            </form>
          </div>
        )}

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
          <Link href="/login" style={{ color: "#0F766E", textDecoration: "none", fontWeight: 600 }}>
            Sign In with different account
          </Link>
        </div>
      </div>
    </div>
  );
}
