"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserX,
  AlertTriangle,
  Activity,
  History,
  Terminal,
  RefreshCw,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { StatMetricCard } from "@/components/admin/AdminCharts";

export function SecuritySection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, FAILED_LOGINS, ADMIN_ACTIONS

  const fetchSecurity = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/security?filter=${filter}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Fetch security error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, [filter]);

  const summary = data?.summary || {};
  const logs = data?.logs || [];
  const suspicious = data?.suspiciousIndicators || [];
  const recentAdminActions = data?.recentAdminActions || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "18px 22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "#0F766E15",
              color: "#0F766E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Campus Security & Audit Architecture
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
              Comprehensive access control, failed login defense, administrative action tracking, and immutable audit logs.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSecurity}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 12,
            background: "var(--surface-2, #F8FAFC)",
            border: "1px solid var(--border, #CBD5E1)",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--txt, #0F172A)",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Security Health Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <StatMetricCard
          label="System Posture"
          value={summary.systemHealth === "SECURE" ? "Protected" : "Alert"}
          subtext="No unauthorized breaches"
          icon={<ShieldCheck size={22} />}
          accentColor="#059669"
        />

        <StatMetricCard
          label="Failed Logins"
          value={summary.failedLoginsCount || 0}
          subtext="Invalid attempts recorded"
          icon={<UserX size={22} />}
          accentColor="#EF4444"
        />

        <StatMetricCard
          label="Suspicious Alerts"
          value={summary.suspiciousIndicatorsCount || 0}
          subtext="IPs exceeding attempt thresholds"
          icon={<AlertTriangle size={22} />}
          accentColor="#F59E0B"
        />

        <StatMetricCard
          label="Audit Log Entries"
          value={summary.totalAuditLogs || 0}
          subtext="Immutable event records"
          icon={<History size={22} />}
          accentColor="#3B82F6"
        />
      </div>

      {/* Suspicious Activity Indicators */}
      {suspicious.length > 0 && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 18,
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#B91C1C", fontWeight: 800, marginBottom: 8 }}>
            <AlertTriangle size={18} />
            <span>Active Suspicious Indicators Detected ({suspicious.length})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suspicious.map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#FFFFFF",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 13,
                  border: "1px solid #FCA5A5",
                }}
              >
                <div>
                  <strong style={{ color: "#0F172A" }}>IP: {item.ipAddress}</strong> • {item.reason}
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: item.threatLevel === "HIGH" ? "#DC2626" : "#F59E0B",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {item.threatLevel} THREAT
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Audit Trail Table */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "20px 22px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Audit Log Stream
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
              Real-time records of administrative interventions, user logins, and state transitions
            </p>
          </div>

          {/* Filter selector */}
          <div style={{ display: "flex", gap: 6, background: "var(--surface-2, #F8FAFC)", padding: 4, borderRadius: 10 }}>
            {["ALL", "FAILED_LOGINS", "ADMIN_ACTIONS"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: filter === f ? 700 : 500,
                  background: filter === f ? "var(--primary, #FF6B00)" : "transparent",
                  color: filter === f ? "#FFFFFF" : "var(--txt-2, #475569)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border, #E2E8F0)", color: "var(--txt-muted, #64748B)" }}>
                <th style={{ padding: "10px 12px" }}>Time</th>
                <th style={{ padding: "10px 12px" }}>Action</th>
                <th style={{ padding: "10px 12px" }}>Entity</th>
                <th style={{ padding: "10px 12px" }}>Actor</th>
                <th style={{ padding: "10px 12px" }}>IP Address</th>
                <th style={{ padding: "10px 12px" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--txt-muted)" }}>
                    No audit logs matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => {
                  const isFailed = log.details && JSON.stringify(log.details).includes("FAILED");

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid var(--border, #F1F5F9)",
                        background: isFailed ? "#FEF2F240" : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px 12px", color: "var(--txt-muted, #64748B)", whiteSpace: "nowrap" }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            background: isFailed ? "#FEE2E2" : log.action === "LOGIN" ? "#E0F2FE" : "#FEF3C7",
                            color: isFailed ? "#DC2626" : log.action === "LOGIN" ? "#0284C7" : "#D97706",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--txt, #0F172A)" }}>
                        {log.entityName}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div>{log.actorName}</div>
                        <div style={{ fontSize: 11, color: "var(--txt-muted, #64748B)" }}>{log.actorRole}</div>
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "var(--txt-muted)" }}>
                        {log.ipAddress}
                      </td>
                      <td style={{ padding: "10px 12px", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <code style={{ fontSize: 11, background: "var(--surface-2, #F8FAFC)", padding: "2px 6px", borderRadius: 4 }}>
                          {JSON.stringify(log.details || {})}
                        </code>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
