"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

interface StudentItem {
  id: string;
  universityStudentId: string;
  session: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED";
  createdAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  user: {
    fullName: string;
    email: string;
    phone: string;
    isEmailVerified: boolean;
    createdAt: string;
  };
  department: {
    name: string;
    code: string;
  };
  hall?: {
    name: string;
    code: string;
  } | null;
}

interface Counts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  moreInfo: number;
}

function VerificationTableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [activeStatus, setActiveStatus] = React.useState(initialStatus);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [students, setStudents] = React.useState<StudentItem[]>([]);
  const [counts, setCounts] = React.useState<Counts>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    moreInfo: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Modal states for Quick Action
  const [modalStudent, setModalStudent] = React.useState<StudentItem | null>(null);
  const [modalAction, setModalAction] = React.useState<"APPROVE" | "REJECT" | "REQUEST_MORE_INFO" | null>(null);
  const [reasonInput, setReasonInput] = React.useState("");
  const [actionError, setActionError] = React.useState("");

  const fetchStudents = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/verifications", window.location.origin);
      if (activeStatus !== "ALL") {
        url.searchParams.set("status", activeStatus);
      }
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      }

      const res = await fetch(url.toString());
      if (res.status === 401 || res.status === 403) {
        router.push("/login?callbackUrl=/admin/verifications");
        return;
      }
      const data = await res.json();
      if (data.students) setStudents(data.students);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, searchQuery, router]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  function handleFilterClick(status: string) {
    setActiveStatus(status);
    const params = new URLSearchParams(window.location.search);
    if (status === "ALL") params.delete("status");
    else params.set("status", status);
    router.push(`/admin/verifications?${params.toString()}`);
  }

  function openActionModal(student: StudentItem, action: "APPROVE" | "REJECT" | "REQUEST_MORE_INFO") {
    setModalStudent(student);
    setModalAction(action);
    setReasonInput("");
    setActionError("");
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modalStudent || !modalAction) return;

    if ((modalAction === "REJECT" || modalAction === "REQUEST_MORE_INFO") && !reasonInput.trim()) {
      setActionError(
        modalAction === "REJECT"
          ? "Please provide a reason for rejecting this student."
          : "Please specify what additional information is required."
      );
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const res = await fetch(`/api/admin/verifications/${modalStudent.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: modalAction,
          reason: reasonInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Failed to execute action.");
        setActionLoading(false);
        return;
      }

      // Close modal and refresh list
      setModalStudent(null);
      setModalAction(null);
      setActionLoading(false);
      fetchStudents();
    } catch {
      setActionError("Network error. Please try again.");
      setActionLoading(false);
    }
  }

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
            href="/admin"
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
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
            CoU <span style={{ color: "#0F766E" }}>Dine</span>
            <span style={{ color: "#F59E0B" }}>X</span> Student Verification Portal
          </span>
        </div>

        <button
          onClick={() => fetchStudents()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #CBD5E1",
            background: "#FFFFFF",
            color: "#0F766E",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 24px" }}>
        {/* Page Title & Subtitle */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px 0", color: "#0F172A" }}>
            Student Verification Queue
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Review official university student IDs, departmental enrolment, and contact credentials before granting cafeteria privileges.
          </p>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Students", count: counts.all },
              { id: "PENDING", label: "Pending", count: counts.pending },
              { id: "APPROVED", label: "Approved", count: counts.approved },
              { id: "REJECTED", label: "Rejected", count: counts.rejected },
              { id: "MORE_INFO_REQUIRED", label: "More Info Needed", count: counts.moreInfo },
            ].map((tab) => {
              const isActive = activeStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleFilterClick(tab.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 12,
                    border: isActive ? "1px solid #0F766E" : "1px solid #E2E8F0",
                    background: isActive ? "#0F766E" : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : "#334155",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: 10,
                      background: isActive ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                      color: isActive ? "#FFFFFF" : "#64748B",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div style={{ position: "relative", minWidth: 280 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                display: "flex",
              }}
            >
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Name, Dept, Email..."
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: 10,
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* The 8-Column Verification Table (Exact SRS Specification) */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 18,
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#64748B" }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px auto" }} />
              <div>Loading verification queue...</div>
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748B" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: "#94A3B8" }}>
                <ClipboardList size={36} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px 0", color: "#0F172A" }}>
                No students found
              </h3>
              <p style={{ fontSize: 13, margin: 0 }}>
                {searchQuery
                  ? `No student matching "${searchQuery}" in status ${activeStatus}.`
                  : `There are currently no students in status ${activeStatus}.`}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#F8FAFC",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#475569",
                    }}
                  >
                    {/* Exact SRS 8 Columns */}
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>Name</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>University ID</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>Department</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>Session</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>Email</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>Phone</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>Registration Date</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "center" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => {
                    const regDate = new Date(st.user.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <tr
                        key={st.id}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* 1. Name */}
                        <td style={{ padding: "14px", fontWeight: 600, color: "#0F172A" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "#CCFBF1",
                                color: "#0F766E",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: 12,
                                flexShrink: 0,
                              }}
                            >
                              {st.user.fullName.charAt(0)}
                            </div>
                            <span>{st.user.fullName}</span>
                          </div>
                        </td>

                        {/* 2. University ID */}
                        <td style={{ padding: "14px", fontFamily: "monospace", color: "#0F766E", fontWeight: 700 }}>
                          {st.universityStudentId}
                        </td>

                        {/* 3. Department */}
                        <td style={{ padding: "14px", color: "#334155" }}>
                          {st.department.name} ({st.department.code})
                        </td>

                        {/* 4. Session */}
                        <td style={{ padding: "14px", color: "#64748B" }}>{st.session}</td>

                        {/* 5. Email */}
                        <td style={{ padding: "14px", color: "#334155" }}>
                          <div>{st.user.email}</div>
                          {st.user.isEmailVerified && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2,
                                color: "#16A34A",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              ✓ verified
                            </span>
                          )}
                        </td>

                        {/* 6. Phone */}
                        <td style={{ padding: "14px", color: "#64748B" }}>{st.user.phone}</td>

                        {/* 7. Registration Date */}
                        <td style={{ padding: "14px", color: "#64748B" }}>{regDate}</td>

                        {/* 8. Verification Status */}
                        <td style={{ padding: "14px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              display: "inline-block",
                              background:
                                st.verificationStatus === "APPROVED"
                                  ? "#DCFCE7"
                                  : st.verificationStatus === "REJECTED"
                                  ? "#FEE2E2"
                                  : st.verificationStatus === "MORE_INFO_REQUIRED"
                                  ? "#E0E7FF"
                                  : "#FEF3C7",
                              color:
                                st.verificationStatus === "APPROVED"
                                  ? "#16A34A"
                                  : st.verificationStatus === "REJECTED"
                                  ? "#DC2626"
                                  : st.verificationStatus === "MORE_INFO_REQUIRED"
                                  ? "#4F46E5"
                                  : "#B45309",
                            }}
                          >
                            {st.verificationStatus}
                          </span>
                        </td>

                        {/* Actions (SRS specification) */}
                        <td style={{ padding: "14px", textAlign: "center" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Link
                              href={`/admin/verifications/${st.id}`}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                background: "#F0FDFA",
                                color: "#0F766E",
                                fontWeight: 600,
                                fontSize: 12,
                                textDecoration: "none",
                                border: "1px solid #CCFBF1",
                              }}
                            >
                              Details
                            </Link>

                            {st.verificationStatus !== "APPROVED" && (
                              <button
                                onClick={() => openActionModal(st, "APPROVE")}
                                title="Approve Student"
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  background: "#DCFCE7",
                                  color: "#16A34A",
                                  fontWeight: 700,
                                  fontSize: 12,
                                  border: "1px solid #BBF7D0",
                                  cursor: "pointer",
                                }}
                              >
                                ✓
                              </button>
                            )}

                            {st.verificationStatus !== "REJECTED" && (
                              <button
                                onClick={() => openActionModal(st, "REJECT")}
                                title="Reject Student"
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  background: "#FEE2E2",
                                  color: "#DC2626",
                                  fontWeight: 700,
                                  fontSize: 12,
                                  border: "1px solid #FECACA",
                                  cursor: "pointer",
                                }}
                              >
                                ✕
                              </button>
                            )}

                            {st.verificationStatus !== "MORE_INFO_REQUIRED" && (
                              <button
                                onClick={() => openActionModal(st, "REQUEST_MORE_INFO")}
                                title="Request More Information"
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  background: "#FEF3C7",
                                  color: "#B45309",
                                  fontWeight: 700,
                                  fontSize: 12,
                                  border: "1px solid #FDE68A",
                                  cursor: "pointer",
                                }}
                              >
                                ?
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Interactive Action Modal */}
      {modalStudent && modalAction && (
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
                  modalAction === "APPROVE"
                    ? "#16A34A"
                    : modalAction === "REJECT"
                    ? "#DC2626"
                    : "#B45309",
              }}
            >
              {modalAction === "APPROVE" && "Approve Student Account"}
              {modalAction === "REJECT" && "Reject Student Verification"}
              {modalAction === "REQUEST_MORE_INFO" && "Request Additional Information"}
            </h3>

            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px 0", lineHeight: 1.4 }}>
              Student: <strong>{modalStudent.user.fullName}</strong> ({modalStudent.universityStudentId} — {modalStudent.department.code})
            </p>

            {actionError && (
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
                {actionError}
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              {modalAction === "APPROVE" ? (
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
                  This student will receive <strong>“✓ Verified CoU Student”</strong> status. Their cafeteria ordering privileges, department delivery, and student discounts will be unlocked immediately.
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
                    {modalAction === "REJECT"
                      ? "Rejection Reason (Required for student correction):"
                      : "Specific Information Required (Will be shown to student):"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder={
                      modalAction === "REJECT"
                        ? "e.g. University ID does not match university department records..."
                        : "e.g. Please verify your session or upload departmental admission slip..."
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
                    setModalStudent(null);
                    setModalAction(null);
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
                      modalAction === "APPROVE"
                        ? "#0F766E"
                        : modalAction === "REJECT"
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
                    : modalAction === "APPROVE"
                    ? "Confirm Approval"
                    : modalAction === "REJECT"
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

export default function AdminVerificationsPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: 32, color: "#64748B" }}>Loading verification portal...</div>}>
      <VerificationTableContent />
    </React.Suspense>
  );
}
