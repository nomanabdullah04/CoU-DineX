"use client";

import React, { useState, useEffect } from "react";
import {
  BellRing,
  Send,
  Users,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export function NotificationsSection() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [targetGroup, setTargetGroup] = useState("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFeedback("");
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGroup, title, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Broadcast failed");
      setFeedback(json.message);
      setTitle("");
      setMessage("");
      fetchNotifications();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
      {/* Broadcast Form */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "22px 24px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#0F766E15", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Broadcast Campus Notice
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
              Send instant high-priority notices to student accounts or dining staff.
            </p>
          </div>
        </div>

        {feedback && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: feedback.startsWith("Error") ? "#FEF2F2" : "#ECFDF5", color: feedback.startsWith("Error") ? "#DC2626" : "#059669", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            {feedback}
          </div>
        )}

        <form onSubmit={handleBroadcast} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
              Target Audience
            </label>
            <select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <option value="ALL">Entire Campus (All Users)</option>
              <option value="STUDENTS">Verified University Students Only</option>
              <option value="STAFF">Kitchen & Delivery Staff</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
              Notice Title
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Cafeteria Holiday Schedule Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
              Notification Body
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write message content..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)" }}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              background: "#0F766E",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(15, 118, 110, 0.25)",
            }}
          >
            <Send size={15} />
            <span>{sending ? "Broadcasting..." : "Dispatch Notification"}</span>
          </button>
        </form>
      </div>

      {/* Recent Dispatches Stream */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "22px 24px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
            Recent Notification Stream
          </h3>
          <button onClick={fetchNotifications} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--txt-muted)" }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--txt-muted)" }}>No notifications sent yet.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "var(--surface-2, #F8FAFC)",
                  padding: "12px 14px",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "var(--txt, #0F172A)" }}>{n.title}</strong>
                  <span style={{ fontSize: 11, color: "var(--txt-muted)" }}>
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ margin: 0, color: "var(--txt-2, #475569)", fontSize: 12 }}>{n.body}</p>
                <div style={{ fontSize: 11, color: "var(--txt-muted)", marginTop: 2 }}>
                  Recipient: {n.recipientName} ({n.recipientRole})
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
