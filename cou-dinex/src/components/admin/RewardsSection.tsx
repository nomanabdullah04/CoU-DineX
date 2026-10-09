"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Trophy,
  Users,
  RefreshCw,
  Gift,
  X,
} from "lucide-react";

export function RewardsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState(50);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rewards");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Fetch rewards error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleGrantPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, points, reason }),
      });
      if (res.ok) {
        setModalOpen(false);
        setUserId("");
        setReason("");
        fetchRewards();
      }
    } catch (err) {
      console.error("Grant error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const rewards = data?.rewards || [];
  const topUsers = data?.topUsers || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
            Campus Loyalty, Points & Rewards Program
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Student dining reward tiers, automated eco bonuses, and manual promotional incentives.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Total Points Issued</span>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary, #FF6B00)" }}>
              {data?.totalPointsIssued || 0} pts
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: "9px 16px",
              borderRadius: 12,
              background: "var(--primary, #FF6B00)",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={15} /> Grant Reward Points
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {/* Top Earners Leaderboard */}
        <div
          style={{
            background: "var(--surface, #FFFFFF)",
            border: "1px solid var(--border, #E2E8F0)",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Trophy size={18} color="#F59E0B" />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Top Student Diners (Loyalty Leaderboard)
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "var(--txt-muted)" }}>No points awarded yet.</div>
            ) : (
              topUsers.map((u: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--surface-2, #F8FAFC)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: idx === 0 ? "#F59E0B" : idx === 1 ? "#94A3B8" : idx === 2 ? "#D97706" : "var(--border)",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>ID: {u.studentId}</div>
                    </div>
                  </div>

                  <span style={{ fontWeight: 800, color: "var(--primary, #FF6B00)" }}>
                    {u.totalPoints} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Points Log */}
        <div
          style={{
            background: "var(--surface, #FFFFFF)",
            border: "1px solid var(--border, #E2E8F0)",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Gift size={18} color="#059669" />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Recent Rewards History
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
            {rewards.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "var(--txt-muted)" }}>No reward events yet.</div>
            ) : (
              rewards.map((r: any) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--surface-2, #F8FAFC)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--txt, #0F172A)" }}>{r.userName}</strong>
                    <div style={{ fontSize: 12, color: "var(--txt-muted)" }}>{r.reason}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 800, color: "#059669" }}>+{r.points} pts</span>
                    <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
