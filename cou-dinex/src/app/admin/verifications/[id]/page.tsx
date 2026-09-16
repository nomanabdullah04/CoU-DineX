"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  User,
  Building2,
  Calendar,
  Mail,
  Phone,
  Hash,
  FileText,
  AlertTriangle,
  History,
} from "lucide-react";

interface StudentDetail {
  id: string;
  universityStudentId: string;
  session: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED";
  verificationMethod: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
    isEmailVerified: boolean;
    isActive: boolean;
    createdAt: string;
  };
  department: {
    name: string;
    code: string;
    faculty: string | null;
    building: string | null;
  };
  hall?: {
    name: string;
    code: string;
  } | null;
}

interface AuditLogItem {
  id: string;
  action: string;
  entityName: string;
  oldValues: any;
  newValues: any;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  } | null;
}

export default function StudentVerificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [student, setStudent] = React.useState<StudentDetail | null>(null);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Modals for actions
  const [activeAction, setActiveAction] = React.useState<"APPROVE" | "REJECT" | "REQUEST_MORE_INFO" | null>(null);
  const [reasonInput, setReasonInput] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const loadStudent = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications/${id}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login?callbackUrl=/admin/verifications");
        return;
      }
      const data = await res.json();
      if (data.student) setStudent(data.student);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
    } catch (err) {
      console.error("Failed to load student details:", err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  React.useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  async function handleActionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeAction) return;

    if ((activeAction === "REJECT" || activeAction === "REQUEST_MORE_INFO") && !reasonInput.trim()) {
      setErrorMsg(
        activeAction === "REJECT"
          ? "Please provide a rejection reason."
          : "Please specify the required information."
      );
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: activeAction,
          reason: reasonInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update status.");
        setActionLoading(false);
        return;
      }

      setSuccessMsg(data.message || "Student status updated successfully.");
      setActiveAction(null);
      setReasonInput("");
      setActionLoading(false);
      loadStudent();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#64748B" }}>
        Loading student verification profile...
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h2 style={{ color: "#DC2626" }}>Student not found</h2>
        <Link href="/admin/verifications" style={{ color: "#0F766E", fontWeight: 600 }}>
          ← Return to Verification Queue
        </Link>
      </div>
    );
  }

  const regDate = new Date(student.user.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/admin/verifications"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Verification Queue
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            Student: {student.user.fullName} ({student.universityStudentId})
          </span>
        </div>

        {/* Status Badge */}
        <span
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            background:
              student.verificationStatus === "APPROVED"
                ? "#DCFCE7"
                : student.verificationStatus === "REJECTED"
                ? "#FEE2E2"
                : student.verificationStatus === "MORE_INFO_REQUIRED"
                ? "#E0E7FF"
                : "#FEF3C7",
            color:
              student.verificationStatus === "APPROVED"
                ? "#16A34A"
                : student.verificationStatus === "REJECTED"
                ? "#DC2626"
                : student.verificationStatus === "MORE_INFO_REQUIRED"
                ? "#4F46E5"
                : "#B45309",
          }}
        >
          ● Status: {student.verificationStatus}
        </span>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px" }}>
        {successMsg && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: "#DCFCE7",
              color: "#166534",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* 2-Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24, alignItems: "start" }}>
          {/* Left Column: Student Identity Profile */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* University Identity Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 20,
                padding: "28px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#CCFBF1",
                    color: "#0F766E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  {student.user.fullName.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px 0", color: "#0F172A" }}>
                    {student.user.fullName}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748B" }}>
                    <span>Registered: {regDate}</span>
                    <span>•</span>
                    <span style={{ color: student.user.isEmailVerified ? "#16A34A" : "#D97706", fontWeight: 600 }}>
                      {student.user.isEmailVerified ? "✓ Email Verified" : "Email Unverified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  padding: "18px",
                  background: "#F8FAFC",
                  borderRadius: 14,
                  border: "1px solid #F1F5F9",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>
                    University Student ID
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F766E", fontFamily: "monospace" }}>
                    {student.universityStudentId}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>
                    Academic Session
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    {student.session}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>
                    Department
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    {student.department.name} ({student.department.code})
                  </div>
                  {student.department.building && (
                    <div style={{ fontSize: 11, color: "#64748B" }}>{student.department.building}</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>
                    Residential Hall
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    {student.hall ? student.hall.name : "Non-Residential / Not Assigned"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>
                    Official Email Address
                  </div>
                  <div style={{ fontSize: 13, color: "#334155" }}>
                    {student.user.email}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>
                    Contact Phone
                  </div>
                  <div style={{ fontSize: 13, color: "#334155" }}>
                    {student.user.phone}
                  </div>
                </div>
              </div>

              {/* Remarks / Rejection Reason if any */}
              {student.rejectionReason && (
                <div
                  style={{
                    marginTop: 20,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background:
                      student.verificationStatus === "REJECTED" ? "#FEE2E2" : "#FEF3C7",
                    border:
                      student.verificationStatus === "REJECTED"
                        ? "1px solid #FECACA"
                        : "1px solid #FDE68A",
                    color:
                      student.verificationStatus === "REJECTED" ? "#991B1B" : "#92400E",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    {student.verificationStatus === "REJECTED"
                      ? "Current Rejection Reason:"
                      : "Information Requested:"}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{student.rejectionReason}</div>
                  {student.verifiedBy && (
                    <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8 }}>
                      By {student.verifiedBy} on {student.verifiedAt ? new Date(student.verifiedAt).toLocaleString() : ""}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Audit History Log */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 20,
                padding: "24px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <History size={18} color="#0F766E" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
                  Verification Audit Log
                </h3>
              </div>

              {auditLogs.length === 0 ? (
                <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                  No administrative actions recorded yet for this student.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <strong style={{ color: "#0F766E" }}>
                          Action: {log.action}
                        </strong>
                        <span style={{ color: "#94A3B8" }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: "#475569" }}>
                        By: {log.user?.fullName || log.user?.email || "System"}
                      </div>
                      {log.newValues?.rejectionReason && (
                        <div style={{ color: "#DC2626", marginTop: 4 }}>
                          Note: {log.newValues.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Administrative Actions & System Specs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Action Box */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 20,
                padding: "24px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px 0", color: "#0F172A" }}>
                Admin Decision
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Approve Button */}
                <button
                  type="button"
                  id="admin-approve-btn"
                  onClick={() => {
                    setActiveAction("APPROVE");
                    setReasonInput("");
                    setErrorMsg("");
                  }}
                  style={{
                    width: "100%",
                    padding: "13px 18px",
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
                    boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Approve Student</span>
                </button>

                {/* Reject Button */}
                <button
                  type="button"
                  id="admin-reject-btn"
                  onClick={() => {
                    setActiveAction("REJECT");
                    setReasonInput("");
                    setErrorMsg("");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    borderRadius: 12,
                    border: "1px solid #FECACA",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <XCircle size={17} />
                  <span>Reject Verification</span>
                </button>

                {/* Request More Information Button */}
                <button
                  type="button"
                  id="admin-request-info-btn"
                  onClick={() => {
                    setActiveAction("REQUEST_MORE_INFO");
                    setReasonInput("");
                    setErrorMsg("");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    borderRadius: 12,
                    border: "1px solid #FDE68A",
                    background: "#FEF3C7",
                    color: "#B45309",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <HelpCircle size={17} />
                  <span>Request More Information</span>
                </button>
              </div>
            </div>

            {/* SRS Architecture Card */}
            <div
              style={{
                background: "#F0FDFA",
                border: "1px solid #CCFBF1",
                borderRadius: 20,
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ShieldCheck size={18} color="#0F766E" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F766E" }}>
                  SRS Verification Architecture
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                Current method: <strong>ADMIN</strong>. The administrator acts as the verification authority.
              </p>
              <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, margin: 0 }}>
                Future method: <strong>OFFICIAL_DATABASE</strong>. The database is prepared with `isSyncedWithOfficialDb` and `officialDbSyncId` for instant university registrar sync without redesign.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      {activeAction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#FFFFFF",
              borderRadius: 20,
              padding: "28px 24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: "0 0 8px 0",
                color:
                  activeAction === "APPROVE"
                    ? "#0F766E"
                    : activeAction === "REJECT"
                    ? "#DC2626"
                    : "#B45309",
              }}
            >
              {activeAction === "APPROVE" && "Approve Student Account"}
              {activeAction === "REJECT" && "Reject Student Account"}
              {activeAction === "REQUEST_MORE_INFO" && "Request Information From Student"}
            </h3>

            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px 0" }}>
              Student: <strong>{student.user.fullName}</strong> ({student.universityStudentId})
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#FEE2E2",
                  color: "#DC2626",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleActionSubmit}>
              {activeAction === "APPROVE" ? (
                <div
                  style={{
                    background: "#F0FDFA",
                    border: "1px solid #CCFBF1",
                    borderRadius: 12,
                    padding: "14px",
                    color: "#0F766E",
                    fontSize: 13,
                    marginBottom: 20,
                    lineHeight: 1.5,
                  }}
                >
                  This action marks the student as <strong>“✓ Verified CoU Student”</strong> and unlocks their full cafeteria discount and delivery services.
                </div>
              ) : (
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: 6,
                    }}
                  >
                    {activeAction === "REJECT"
                      ? "Rejection Reason (Required):"
                      : "Required Information Details (Required):"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder={
                      activeAction === "REJECT"
                        ? "Explain why the university ID or records could not be verified..."
                        : "Describe what the student must correct or provide..."
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAction(null);
                    setErrorMsg("");
                  }}
                  disabled={actionLoading}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background:
                      activeAction === "APPROVE"
                        ? "#0F766E"
                        : activeAction === "REJECT"
                        ? "#DC2626"
                        : "#D97706",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: actionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {actionLoading
                    ? "Submitting..."
                    : activeAction === "APPROVE"
                    ? "Confirm Approval"
                    : activeAction === "REJECT"
                    ? "Confirm Rejection"
                    : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
