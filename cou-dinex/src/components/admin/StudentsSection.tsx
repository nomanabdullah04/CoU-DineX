"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Building,
  GraduationCap,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";

export function StudentsSection() {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/students?page=${page}&status=${statusFilter}&search=${encodeURIComponent(search)}`;
      if (deptFilter) url += `&dept=${deptFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setStudents(json.students);
        setDepartments(json.departments);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter, deptFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header and Search Filters */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Student Directory & Academic Profiles
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
              Official Comilla University student accounts, verification records, and privacy-protected contact information.
            </p>
          </div>

          <button
            onClick={fetchStudents}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 10,
              background: "var(--surface-2, #F8FAFC)",
              border: "1px solid var(--border, #CBD5E1)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Filter Controls Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 240, display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--txt-muted)" }} />
              <input
                type="text"
                placeholder="Search by student ID or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  borderRadius: 12,
                  border: "1px solid var(--border, #CBD5E1)",
                  fontSize: 13,
                  outline: "none",
                  background: "var(--surface-2, #F8FAFC)",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "9px 16px",
                borderRadius: 12,
                background: "var(--primary, #FF6B00)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid var(--border, #CBD5E1)",
              fontSize: 13,
              background: "var(--surface, #FFFFFF)",
              fontWeight: 600,
              color: "var(--txt, #0F172A)",
            }}
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="APPROVED">Approved Students</option>
            <option value="PENDING">Pending Verification</option>
            <option value="MORE_INFO_REQUIRED">More Info Needed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid var(--border, #CBD5E1)",
              fontSize: 13,
              background: "var(--surface, #FFFFFF)",
              fontWeight: 600,
              color: "var(--txt, #0F172A)",
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--surface-2, #F8FAFC)", borderBottom: "1px solid var(--border, #E2E8F0)", color: "var(--txt-muted, #64748B)" }}>
                <th style={{ padding: "12px 16px" }}>Student ID</th>
                <th style={{ padding: "12px 16px" }}>Full Name</th>
                <th style={{ padding: "12px 16px" }}>Department</th>
                <th style={{ padding: "12px 16px" }}>Hall</th>
                <th style={{ padding: "12px 16px" }}>Verification</th>
                <th style={{ padding: "12px 16px" }}>Contact (Masked)</th>
                <th style={{ padding: "12px 16px" }}>Schedules</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--txt-muted)" }}>
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--txt-muted)" }}>
                    No student records matching your query.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} style={{ borderBottom: "1px solid var(--border, #F1F5F9)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "var(--txt, #0F172A)" }}>
                      {st.studentId}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                      {st.user.fullName}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {st.department?.code || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--txt-muted)" }}>
                      {st.hall?.name || "Non-resident"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 800,
                          background:
                            st.verificationStatus === "APPROVED"
                              ? "#ECFDF5"
                              : st.verificationStatus === "PENDING"
                              ? "#FEF3C7"
                              : st.verificationStatus === "MORE_INFO_REQUIRED"
                              ? "#EFF6FF"
                              : "#FEF2F2",
                          color:
                            st.verificationStatus === "APPROVED"
                              ? "#059669"
                              : st.verificationStatus === "PENDING"
                              ? "#D97706"
                              : st.verificationStatus === "MORE_INFO_REQUIRED"
                              ? "#2563EB"
                              : "#DC2626",
                        }}
                      >
                        {st.verificationStatus}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--txt-muted)" }}>
                      <div>{st.user.maskedPhone}</div>
                      <div>{st.user.maskedEmail}</div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--txt-muted)" }}>
                      {st.classScheduleCount} classes
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--border, #E2E8F0)" }}>
            <span style={{ fontSize: 12, color: "var(--txt-muted)" }}>
              Page {page} of {pagination.totalPages} ({pagination.total} total students)
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border, #CBD5E1)", background: "transparent", cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border, #CBD5E1)", background: "transparent", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
