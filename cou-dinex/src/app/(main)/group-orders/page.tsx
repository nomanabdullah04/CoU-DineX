"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  ArrowRight,
  Share2,
  Clock,
  Sparkles,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface GroupOrderSummary {
  id: string;
  title: string;
  shareCode: string;
  status: string;
  creator: {
    fullName: string;
    phone: string;
  };
  memberCount: number;
  isCreator: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function GroupOrdersListPage() {
  const router = useRouter();
  const [groupOrders, setGroupOrders] = useState<GroupOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [expiresMinutes, setExpiresMinutes] = useState("60");
  const [createLoading, setCreateLoading] = useState(false);

  // Join code state
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function fetchGroupOrders() {
    try {
      const res = await fetch("/api/group-orders");
      if (!res.ok) throw new Error("Failed to load group orders");
      const data = await res.json();
      setGroupOrders(data.groupOrders || []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroupOrders();
  }, []);

  const handleCreateGroupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreateLoading(true);
    try {
      const res = await fetch("/api/group-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          expiresMinutes: Number(expiresMinutes),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group order");

      setShowCreateModal(false);
      setNewTitle("");
      router.push(`/group-orders/${data.groupOrder.shareCode}`);
    } catch (err: any) {
      alert(err.message || "Failed to create group order");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinLoading(true);
    setJoinError(null);
    const code = joinCode.toUpperCase().trim();

    try {
      const res = await fetch(`/api/group-orders/${code}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join group");

      router.push(`/group-orders/${code}`);
    } catch (err: any) {
      setJoinError(err.message || "Invalid group share code");
    } finally {
      setJoinLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 80px 16px" }}>
      {/* Top Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
          borderRadius: 24,
          padding: "28px 24px",
          color: "#FFFFFF",
          marginBottom: 28,
          boxShadow: "0 10px 25px rgba(15, 118, 110, 0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 18,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              background: "rgba(255,255,255,0.18)",
              padding: "4px 10px",
              borderRadius: 99,
              display: "inline-block",
              marginBottom: 8,
            }}
          >
            Phase 13 Innovation • Social Dining
          </span>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
            Campus Group Ordering &amp; Split Pay
          </h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.9, maxWidth: 540, lineHeight: 1.5 }}>
            Order together with friends in dorms, labs, or faculty rooms. Everyone picks their own food, and our secure split architecture calculates individual totals!
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: "12px 22px",
            borderRadius: 14,
            background: "#FFFFFF",
            color: "#0F766E",
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
          }}
        >
          <Plus size={18} />
          <span>Create Group Order</span>
        </button>
      </div>

      {/* Quick Join With Code Bar */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "18px 20px",
          marginBottom: 28,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <form onSubmit={handleJoinByCode} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt-muted)", marginBottom: 4 }}>
              JOIN WITH A CAMPUS SHARE CODE
            </label>
            <input
              type="text"
              placeholder="e.g. DINE-7K9A"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--txt)",
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={joinLoading || !joinCode.trim()}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              background: "var(--primary)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: joinLoading || !joinCode.trim() ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 18,
            }}
          >
            <span>{joinLoading ? "Joining..." : "Join Group Room"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {joinError && (
          <p style={{ margin: "8px 0 0 0", color: "#DC2626", fontSize: 12, fontWeight: 600 }}>
            {joinError}
          </p>
        )}
      </div>

      {/* Active Group Orders Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={20} color="var(--primary)" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
              Your Group Dining Orders
            </h2>
          </div>
          <span style={{ fontSize: 12, color: "var(--txt-muted)" }}>
            {groupOrders.length} active room(s)
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--txt-muted)" }}>
            Loading group orders...
          </div>
        ) : groupOrders.length === 0 ? (
          <div
            style={{
              background: "var(--surface)",
              border: "1px dashed var(--border)",
              borderRadius: 20,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <Users size={40} color="var(--primary)" style={{ opacity: 0.5, margin: "0 auto 12px auto" }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: "0 0 6px 0" }}>
              No Active Group Orders
            </h3>
            <p style={{ fontSize: 13, color: "var(--txt-muted)", maxWidth: 380, margin: "0 auto 20px auto" }}>
              Planning to eat together with friends? Create a group room and invite your dorm-mates!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                background: "var(--primary)",
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
              <Plus size={15} />
              <span>Create First Group</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {groupOrders.map((go) => (
              <div
                key={go.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  padding: "20px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: go.status === "OPEN" ? "#D1FAE5" : go.status === "PLACED" ? "#DBEAFE" : "#FEE2E2",
                        color: go.status === "OPEN" ? "#065F46" : go.status === "PLACED" ? "#1E40AF" : "#991B1B",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {go.status}
                    </span>

                    <button
                      onClick={() => copyToClipboard(go.shareCode)}
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "3px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--txt)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {copiedCode === go.shareCode ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                      <span>{go.shareCode}</span>
                    </button>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: "0 0 6px 0" }}>
                    {go.title}
                  </h3>

                  <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "0 0 12px 0" }}>
                    Host: <strong>{go.creator.fullName}</strong> • {go.memberCount} member(s) joined
                  </p>
                </div>

                <Link
                  href={`/group-orders/${go.shareCode}`}
                  style={{
                    padding: "10px",
                    borderRadius: 12,
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 14,
                  }}
                >
                  <span>Open Dining Room</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Order Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 24,
              border: "1px solid var(--border)",
              maxWidth: 440,
              width: "100%",
              padding: "24px 22px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--txt)", margin: "0 0 6px 0" }}>
              Start a Campus Group Order
            </h3>
            <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "0 0 20px 0" }}>
              Give your group order a name (e.g. Hall Room 304 Dinner, CSE Project Group Lunch).
            </p>

            <form onSubmit={handleCreateGroupOrder} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>
                  Group Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. KNH Dorm 3rd Floor Feast"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--txt)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>
                  Order Deadline
                </label>
                <select
                  value={expiresMinutes}
                  onChange={(e) => setExpiresMinutes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--txt)",
                    fontSize: 14,
                    outline: "none",
                  }}
                >
                  <option value="30">30 minutes from now</option>
                  <option value="60">1 hour from now</option>
                  <option value="120">2 hours from now</option>
                  <option value="240">4 hours (Pre-order)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    background: "var(--surface-2)",
                    color: "var(--txt)",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading || !newTitle.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    background: "var(--primary)",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 800,
                    border: "none",
                    cursor: createLoading || !newTitle.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {createLoading ? "Creating..." : "Create & Get Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
