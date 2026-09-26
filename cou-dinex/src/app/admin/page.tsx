"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  LogOut,
  Users,
  Search,
  ChefHat,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface VerificationCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  moreInfo: number;
}

interface StudentItem {
  id: string;
  universityStudentId: string;
  session: string;
  verificationStatus: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
  };
  department: {
    name: string;
    code: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [counts, setCounts] = React.useState<VerificationCounts>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    moreInfo: 0,
  });
  const [recentStudents, setRecentStudents] = React.useState<StudentItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/verifications");
        if (res.status === 401 || res.status === 403) {
          router.push("/login?callbackUrl=/admin");
          return;
        }
        const data = await res.json();
        if (data.counts) {
          setCounts(data.counts);
        }
        if (data.students) {
          setRecentStudents(data.students.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
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
      {/* Top Global Admin Bar */}
      <header
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo size="sm" />
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                background: "#0F766E",
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              ADMIN
            </span>
            <span style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
              • Campus Dining Administration & Student Verification OS
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/admin/verifications"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: "#F0FDFA",
              color: "#0F766E",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid #CCFBF1",
            }}
          >
            <UserCheck size={16} />
            <span>Verification Queue</span>
            {counts.pending > 0 && (
              <span
                style={{
                  marginLeft: 4,
                  padding: "2px 7px",
                  borderRadius: 10,
                  background: "#F59E0B",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {counts.pending}
              </span>
            )}
          </Link>

          <Link
            href="/kitchen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: "#0F766E",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(15, 118, 110, 0.2)",
            }}
          >
            <ChefHat size={16} />
            <span>Kitchen Display (KDS)</span>
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              color: "#64748B",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px 0", color: "#0F172A" }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Manage Comilla University student admissions to the campus dining ecosystem.
          </p>
        </div>

        {/* 4 Metric Cards (SRS specifications) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginBottom: 36,
          }}
        >
          {/* Pending Verifications */}
          <Link
            href="/admin/verifications?status=PENDING"
            style={{
              textDecoration: "none",
              background: "#FFFFFF",
              border: "1px solid #FEF3C7",
              borderRadius: 20,
              padding: "22px 20px",
              boxShadow: "0 4px 16px rgba(245, 158, 11, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(245, 158, 11, 0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(245, 158, 11, 0.08)";
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#FEF3C7",
                color: "#B45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={28} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>Pending Review</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                {loading ? "..." : counts.pending}
              </div>
              <div style={{ fontSize: 12, color: "#B45309" }}>Action required</div>
            </div>
          </Link>

          {/* Approved Students */}
          <Link
            href="/admin/verifications?status=APPROVED"
            style={{
              textDecoration: "none",
              background: "#FFFFFF",
              border: "1px solid #DCFCE7",
              borderRadius: 20,
              padding: "22px 20px",
              boxShadow: "0 4px 16px rgba(22, 163, 74, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(22, 163, 74, 0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(22, 163, 74, 0.08)";
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#DCFCE7",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>Approved Students</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                {loading ? "..." : counts.approved}
              </div>
              <div style={{ fontSize: 12, color: "#16A34A" }}>Full dining access</div>
            </div>
          </Link>

          {/* More Information Required */}
          <Link
            href="/admin/verifications?status=MORE_INFO_REQUIRED"
            style={{
              textDecoration: "none",
              background: "#FFFFFF",
              border: "1px solid #E0E7FF",
              borderRadius: 20,
              padding: "22px 20px",
              boxShadow: "0 4px 16px rgba(79, 70, 229, 0.06)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(79, 70, 229, 0.14)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(79, 70, 229, 0.06)";
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#E0E7FF",
                color: "#4F46E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HelpCircle size={28} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4338CA" }}>More Info Needed</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                {loading ? "..." : counts.moreInfo}
              </div>
              <div style={{ fontSize: 12, color: "#4F46E5" }}>Awaiting student edit</div>
            </div>
          </Link>

          {/* Rejected Students */}
          <Link
            href="/admin/verifications?status=REJECTED"
            style={{
              textDecoration: "none",
              background: "#FFFFFF",
              border: "1px solid #FEE2E2",
              borderRadius: 20,
              padding: "22px 20px",
              boxShadow: "0 4px 16px rgba(220, 38, 38, 0.06)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(220, 38, 38, 0.14)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(220, 38, 38, 0.06)";
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <XCircle size={28} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#B91C1C" }}>Rejected</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                {loading ? "..." : counts.rejected}
              </div>
              <div style={{ fontSize: 12, color: "#DC2626" }}>Correction allowed</div>
            </div>
          </Link>
        </div>

        {/* Quick Launch Banner: Student Verification Portal */}
        <div
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
            borderRadius: 20,
            padding: "26px 30px",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            boxShadow: "0 10px 25px rgba(15, 118, 110, 0.22)",
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.18)", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8, color: "#FFFFFF" }}>
              Identity & Admission
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              Student Verification Portal
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.92)", margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
              Review registration requests with 8-point university identity check: Name, University ID, Department, Session, Email, Phone, and Registration Timestamp.
            </p>
          </div>

          <Link
            href="/admin/verifications"
            id="open-verification-portal-btn"
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#0F766E",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              flexShrink: 0,
              transition: "transform 0.15s ease",
            }}
          >
            <span>Open Verification Table</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Menu Management Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)",
            borderRadius: 20,
            padding: "26px 30px",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 36,
            boxShadow: "0 10px 25px rgba(234, 88, 12, 0.22)",
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.22)", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8, color: "#FFFFFF" }}>
              Phase 6 Feature
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              Food Menu Management
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.94)", margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
              Create, edit, and manage cafeteria menu items. Control prices, availability, stock levels, categories, and daily specials.
            </p>
          </div>

          <Link
            href="/admin/menu"
            id="open-menu-management-btn"
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#EA580C",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              flexShrink: 0,
              transition: "transform 0.15s ease",
            }}
          >
            <span>Manage Menu</span>
            <ArrowRight size={16} />
          </Link>
        </div>



        {/* Recent Registrations Preview */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 20,
            padding: "24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px 0", color: "#0F172A" }}>
                Recent Student Registrations
              </h3>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                Latest students who submitted university credentials
              </p>
            </div>

            <Link
              href="/admin/verifications"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#0F766E",
                textDecoration: "none",
              }}
            >
              View All ({counts.all}) →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748B" }}>
              Loading recent students...
            </div>
          ) : recentStudents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748B" }}>
              No students registered yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Name</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>University ID</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Department</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Session</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 14px", fontWeight: 600, textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((st) => (
                    <tr key={st.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px", fontWeight: 600, color: "#0F172A" }}>
                        {st.user.fullName}
                      </td>
                      <td style={{ padding: "14px", fontFamily: "monospace", color: "#0F766E", fontWeight: 700 }}>
                        {st.universityStudentId}
                      </td>
                      <td style={{ padding: "14px", color: "#475569" }}>
                        {st.department.name} ({st.department.code})
                      </td>
                      <td style={{ padding: "14px", color: "#64748B" }}>
                        {st.session}
                      </td>
                      <td style={{ padding: "14px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
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
                      <td style={{ padding: "14px", textAlign: "right" }}>
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
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
