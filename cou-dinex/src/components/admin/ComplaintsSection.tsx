"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  Send,
} from "lucide-react";

export function ComplaintsSection() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/complaints?status=${statusFilter}`);
      const json = await res.json();
      if (json.success) {
        setComplaints(json.complaints);
      }
    } catch (err) {
      console.error("Fetch complaints error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleResolve = async (status: string) => {
    if (!selectedComplaint) return;
    setResolving(true);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: selectedComplaint.id,
          status,
          resolutionNote,
        }),
      });
      if (res.ok) {
        setSelectedComplaint(null);
        setResolutionNote("");
        fetchComplaints();
      }
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Banner */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
            Student Feedback & Grievance Redressal
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Review, investigate, and record formal resolution notes for campus dining complaints.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid var(--border, #CBD5E1)", fontSize: 13, fontWeight: 600, background: "var(--surface, #FFFFFF)" }}
          >
            <option value="ALL">All Complaints</option>
            <option value="PENDING">Pending Attention</option>
            <option value="IN_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <button
            onClick={fetchComplaints}
            style={{ padding: "8px 12px", borderRadius: 10, background: "var(--surface-2, #F8FAFC)", border: "1px solid var(--border, #CBD5E1)", cursor: "pointer" }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Complaints List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>No complaints matching criteria.</div>
        ) : (
          complaints.map((c) => (
            <div
              key={c.id}
              style={{
                background: "var(--surface, #FFFFFF)",
                border: "1px solid var(--border, #E2E8F0)",
                borderRadius: 18,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      background: c.status === "RESOLVED" ? "#ECFDF5" : c.status === "PENDING" ? "#FEF2F2" : "#FEF3C7",
                      color: c.status === "RESOLVED" ? "#059669" : c.status === "PENDING" ? "#DC2626" : "#D97706",
                    }}
                  >
                    {c.status}
                  </span>
                  <h4 style={{ margin: "6px 0 2px", fontSize: 15, fontWeight: 800, color: "var(--txt, #0F172A)" }}>
                    {c.subject}
                  </h4>
                </div>

                <span style={{ fontSize: 11, color: "var(--txt-muted)" }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: "var(--txt-2, #475569)", lineHeight: 1.4 }}>
                {c.description}
              </p>

              <div style={{ fontSize: 12, color: "var(--txt-muted)", borderTop: "1px solid var(--border, #F1F5F9)", paddingTop: 8 }}>
                Student: <strong>{c.userName}</strong> • Order #{c.orderNumber}
              </div>

              {c.resolutionNote && (
                <div style={{ background: "#F0FDF4", padding: "8px 12px", borderRadius: 8, fontSize: 12, color: "#166534" }}>
                  Resolution: {c.resolutionNote}
                </div>
              )}

              {c.status !== "RESOLVED" && (
                <button
                  onClick={() => { setSelectedComplaint(c); setResolutionNote(""); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    background: "var(--primary, #FF6B00)",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    alignSelf: "flex-end",
                  }}
                >
                  Take Action / Resolve
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {selectedComplaint && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface, #FFFFFF)",
              borderRadius: 20,
              maxWidth: 440,
              width: "100%",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Resolve Complaint</h3>
              <button onClick={() => setSelectedComplaint(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "0 0 14px" }}>
              Issue: <strong>{selectedComplaint.subject}</strong> from {selectedComplaint.userName}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Resolution Notes (Sent to Student & Audit Trail)</label>
              <textarea
                rows={4}
                placeholder="Explain the corrective action taken, cafeteria refund, or verification update..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => handleResolve("DISMISSED")}
                  style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={resolving || !resolutionNote.trim()}
                  onClick={() => handleResolve("RESOLVED")}
                  style={{ padding: "8px 18px", borderRadius: 10, background: "#059669", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  {resolving ? "Resolving..." : "Mark as Resolved"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
