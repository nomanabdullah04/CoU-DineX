"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Copy,
  Check,
  Share2,
  Clock,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Lock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { getItemImageUrl } from "@/lib/foodImages";

interface MemberItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  specialInstructions?: string | null;
}

interface Member {
  id: string;
  studentId: string;
  name: string;
  role: string;
  isPaid: boolean;
  paymentMethod?: string | null;
  transactionId?: string | null;
  itemCount: number;
  itemSubtotal: number;
  splitDeliveryShare: number;
  totalShare: number;
  items: MemberItem[];
}

interface GroupOrderDetails {
  id: string;
  code: string;
  title: string;
  status: "OPEN" | "LOCKED" | "ORDERED" | "CANCELLED";
  cafeteriaId: string;
  cafeteriaName: string;
  hostName: string;
  hostStudentId: string;
  deliveryLocation: string;
  deliveryType: string;
  createdAt: string;
  orderId?: string | null;
  memberCount: number;
  activeDinersCount: number;
  totalFoodAmount: number;
  sharedDeliveryFee: number;
  grandTotal: number;
  currentUser: {
    studentId: string;
    name: string;
    isHost: boolean;
    isMember: boolean;
    memberId?: string;
    isPaid?: boolean;
    myTotalShare?: number;
    myItems?: MemberItem[];
  };
  members: Member[];
  cafeteriaMenu: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    isAvailable: boolean;
    imageUrl?: string | null;
  }>;
}

export default function GroupOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const [data, setData] = React.useState<GroupOrderDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Join state (for non-members who opened link)
  const [joinName, setJoinName] = React.useState("");
  const [isJoining, setIsJoining] = React.useState(false);

  // Add Item Drawer
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [itemAddingId, setItemAddingId] = React.useState<string | null>(null);

  // Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<"BKASH" | "NAGAD" | "CARD" | "CASH_AT_COUNTER">("BKASH");
  const [isPaying, setIsPaying] = React.useState(false);

  // Host Place Order
  const [isPlacing, setIsPlacing] = React.useState(false);

  const fetchGroupOrder = React.useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/group-orders/${code}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Group order not found.");
        throw new Error("Failed to load group order details.");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load group order.");
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  React.useEffect(() => {
    fetchGroupOrder();
    const interval = setInterval(fetchGroupOrder, 5000); // Polling for real-time updates
    return () => clearInterval(interval);
  }, [fetchGroupOrder]);

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = window.location.href;
      if (navigator.share) {
        navigator.share({
          title: `Join my CoU DineX Group Order: ${data?.title || code}`,
          text: `Add your food items to group order ${code} from ${data?.cafeteriaName || "CoU Cafeteria"}!`,
          url: shareUrl,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleJoinOrder = async () => {
    setIsJoining(true);
    try {
      const res = await fetch(`/api/group-orders/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: joinName }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to join group order.");
      await fetchGroupOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleAddItem = async (menuItemId: string) => {
    setItemAddingId(menuItemId);
    try {
      const res = await fetch(`/api/group-orders/${code}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, quantity: 1 }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to add food.");
      await fetchGroupOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setItemAddingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/group-orders/${code}/items?itemId=${itemId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to remove item.");
      await fetchGroupOrder();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExecutePayment = async () => {
    setIsPaying(true);
    try {
      const res = await fetch(`/api/group-orders/${code}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Payment failed.");
      setIsPayModalOpen(false);
      await fetchGroupOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handlePlaceGroupOrder = async () => {
    if (!confirm("Are you sure you want to lock and dispatch this group order to the cafeteria kitchen?")) return;
    setIsPlacing(true);
    try {
      const res = await fetch(`/api/group-orders/${code}/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to place order.");
      await fetchGroupOrder();
      if (resData.orderId) {
        router.push(`/orders/${resData.orderId}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPlacing(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px" }} className="animate-pulse space-y-4">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "30px", background: "var(--surface)", borderRadius: 20, textAlign: "center", border: "1px solid var(--border)" }}>
        <AlertCircle size={44} color="var(--error)" className="mx-auto mb-3" />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--txt)" }}>Group Room Not Found</h2>
        <p style={{ color: "var(--txt-muted)", fontSize: 14, margin: "8px 0 20px" }}>{error || "This group order code is invalid or has expired."}</p>
        <Link
          href="/group-orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 22px",
            borderRadius: 12,
            background: "var(--primary)",
            color: "#FFF",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} /> Back to Group Orders
        </Link>
      </div>
    );
  }

  const currentUser = data?.currentUser || {
    studentId: "",
    name: "",
    isHost: false,
    isMember: false,
    isPaid: false,
    myTotalShare: 0,
    myItems: [],
  };
  const members = data?.members || [];
  const cafeteriaMenu = data?.cafeteriaMenu || [];
  const categories = ["ALL", ...Array.from(new Set(cafeteriaMenu.map((m) => m?.category || "General")))];
  const filteredMenu = selectedCategory === "ALL"
    ? cafeteriaMenu
    : cafeteriaMenu.filter((m) => (m?.category || "General") === selectedCategory);

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 60 }} className="space-y-6">
      {/* ── Top Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Link
          href="/group-orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--txt-2)",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> All Group Orders
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => fetchGroupOrder()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 99,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--txt-2)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={12} /> Sync
          </button>
          <span
            style={{
              padding: "5px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 800,
              background: data.status === "OPEN" ? "rgba(16, 185, 129, 0.12)" : data.status === "ORDERED" ? "rgba(59, 130, 246, 0.12)" : "rgba(245, 158, 11, 0.12)",
              color: data.status === "OPEN" ? "#10B981" : data.status === "ORDERED" ? "#3B82F6" : "#F59E0B",
              border: "1px solid currentColor",
            }}
          >
            {data.status === "OPEN" ? "● OPEN FOR ORDERS" : data.status === "ORDERED" ? "✓ DISPATCHED TO KITCHEN" : "🔒 LOCKED"}
          </span>
        </div>
      </div>

      {/* ── Header Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F766E 0%, #115E59 100%)",
          borderRadius: 24,
          padding: "24px 28px",
          color: "#FFFFFF",
          boxShadow: "0 12px 28px -6px rgba(15, 118, 110, 0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <Users size={14} /> Group Dining Room
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              {data.title}
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>
              Host: <strong>{data.hostName}</strong> • {data.cafeteriaName} • Delivery to: <strong>{data.deliveryLocation}</strong>
            </p>
          </div>

          {/* Share Code Pill */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 16,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              backdropFilter: "blur(6px)",
            }}
          >
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85, fontWeight: 700 }}>
                INVITE CODE
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.1em" }}>
                {data.code}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleCopyCode}
                title="Copy Code"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#FFFFFF",
                  color: "#0F766E",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                {copied ? <Check size={18} color="#16A34A" /> : <Copy size={18} />}
              </button>
              <button
                onClick={handleShareLink}
                title="Share link"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── If not a member yet: Join Prompt ── */}
      {!currentUser.isMember && (
        <div
          style={{
            background: "var(--surface)",
            border: "2px dashed var(--primary)",
            borderRadius: 20,
            padding: "24px",
            textAlign: "center",
          }}
        >
          <Users size={36} color="var(--primary)" className="mx-auto mb-2" />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: "0 0 6px" }}>
            You have been invited to join this table!
          </h3>
          <p style={{ color: "var(--txt-muted)", fontSize: 13, margin: "0 0 16px" }}>
            Add your favorite dishes, track your personal plate, and split payment securely.
          </p>
          <div style={{ maxWidth: 360, margin: "0 auto", display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Your Name / Nickname"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--txt)",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={handleJoinOrder}
              disabled={isJoining}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                background: "var(--primary)",
                color: "#FFF",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isJoining ? "Joining..." : "Join Table"}
            </button>
          </div>
        </div>
      )}

      {/* ── Bill Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Active Diners</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "var(--txt)", marginTop: 4 }}>
            {data.activeDinersCount} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--txt-muted)" }}>/ {data.memberCount} joined</span>
          </div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Food Total</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "var(--txt)", marginTop: 4 }}>
            ৳{data.totalFoodAmount}
          </div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Split Delivery Fee</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)", marginTop: 4 }}>
            ৳{data.sharedDeliveryFee} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--txt-muted)" }}>shared</span>
          </div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Group Grand Total</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#10B981", marginTop: 4 }}>
            ৳{data.grandTotal}
          </div>
        </div>
      </div>

      {/* ── My Personal Share Banner (if member) ── */}
      {currentUser.isMember && (
        <div
          style={{
            background: currentUser.isPaid ? "rgba(16, 185, 129, 0.08)" : "rgba(15, 118, 110, 0.08)",
            border: currentUser.isPaid ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(15, 118, 110, 0.3)",
            borderRadius: 20,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: currentUser.isPaid ? "#10B981" : "var(--primary)",
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {currentUser.isPaid ? <CheckCircle2 size={24} /> : <CreditCard size={22} />}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>
                My Personal Share ({currentUser.myItems?.length || 0} items)
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--txt)" }}>
                ৳{currentUser.myTotalShare || 0}{" "}
                <span style={{ fontSize: 13, fontWeight: 600, color: currentUser.isPaid ? "#10B981" : "#F59E0B" }}>
                  {currentUser.isPaid ? "• ✓ Paid" : "• Payment Pending"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {data.status === "OPEN" && (
              <button
                onClick={() => setIsMenuOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 12,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--txt)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={16} /> Add Food to My Plate
              </button>
            )}

            {!currentUser.isPaid && (currentUser.myTotalShare || 0) > 0 && data.status !== "ORDERED" && (
              <button
                onClick={() => setIsPayModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 20px",
                  borderRadius: 12,
                  background: "var(--primary)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-primary)",
                }}
              >
                <CreditCard size={16} /> Pay My Share (৳{currentUser.myTotalShare})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Member Plates (Split Tracking) ── */}
      <div className="space-y-4">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color="var(--primary)" /> Member Plates & Split Totals
          </h2>
          <span style={{ fontSize: 13, color: "var(--txt-muted)" }}>
            Individual totals calculated automatically
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const isMe = member.studentId === currentUser.studentId;
            return (
              <div
                key={member.id}
                style={{
                  background: "var(--surface)",
                  border: isMe ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: 20,
                  padding: "18px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Member Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: "var(--txt)" }}>
                          {member.name}
                        </span>
                        {member.role === "HOST" && (
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(15, 118, 110, 0.15)", color: "var(--primary)", fontWeight: 800 }}>
                            HOST
                          </span>
                        )}
                        {isMe && (
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", fontWeight: 800 }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--txt-muted)", marginTop: 2 }}>
                        {member.items.length === 0 ? "No items selected yet" : `${member.items.length} item(s) on plate`}
                      </div>
                    </div>

                    {/* Paid status badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 99,
                        background: member.isPaid ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                        color: member.isPaid ? "#10B981" : "#F59E0B",
                      }}
                    >
                      {member.isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {member.isPaid ? `Paid (${member.paymentMethod || "VERIFIED"})` : "Unpaid"}
                    </span>
                  </div>

                  {/* Items List */}
                  {member.items.length > 0 ? (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }} className="space-y-2">
                      {member.items.map((item) => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                          <div style={{ color: "var(--txt)", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 700, color: "var(--primary)" }}>{item.quantity}×</span>
                            <span>{item.name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "var(--txt)" }}>৳{item.totalPrice}</span>
                            {isMe && data.status === "OPEN" && (
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                title="Remove item"
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "var(--txt-muted)",
                                  cursor: "pointer",
                                  padding: 2,
                                }}
                              >
                                <Trash2 size={14} className="hover:text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "14px", textAlign: "center", color: "var(--txt-muted)", fontSize: 12, background: "var(--surface-2)", borderRadius: 12 }}>
                      Plate is empty
                    </div>
                  )}
                </div>

                {/* Subtotal & Delivery Share footer */}
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed var(--border)", fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-muted)", marginBottom: 2 }}>
                    <span>Food Subtotal:</span>
                    <span>৳{member.itemSubtotal}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-muted)", marginBottom: 4 }}>
                    <span>Delivery Share:</span>
                    <span>৳{member.splitDeliveryShare}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14, color: "var(--txt)" }}>
                    <span>Total Individual Share:</span>
                    <span style={{ color: "var(--primary)" }}>৳{member.totalShare}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Host Order Dispatch Control ── */}
      {currentUser.isHost && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 22,
            padding: "22px 26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                Host Command Center
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "4px 0 0" }}>
              {data.status === "OPEN"
                ? "Once everyone has added their food and paid their share, lock and dispatch the order to the kitchen."
                : data.status === "ORDERED"
                ? "This order has already been dispatched to the central cafeteria kitchen!"
                : "This order is locked."}
            </p>
          </div>

          <div>
            {data.status === "OPEN" && (
              <button
                onClick={handlePlaceGroupOrder}
                disabled={isPlacing || data.totalFoodAmount === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 14,
                  background: data.totalFoodAmount === 0 ? "var(--border)" : "#10B981",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 14,
                  border: "none",
                  cursor: data.totalFoodAmount === 0 ? "not-allowed" : "pointer",
                  boxShadow: data.totalFoodAmount === 0 ? "none" : "0 8px 20px -4px rgba(16, 185, 129, 0.4)",
                }}
              >
                <ShoppingBag size={18} />
                {isPlacing ? "Dispatching to Kitchen..." : `Lock & Dispatch Order (৳${data.grandTotal})`}
              </button>
            )}

            {data.orderId && (
              <Link
                href={`/orders/${data.orderId}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 24px",
                  borderRadius: 14,
                  background: "var(--primary)",
                  color: "#FFF",
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Track Live Order in Kitchen <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Add Food Modal / Drawer ── */}
      {isMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
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
              maxWidth: 640,
              width: "100%",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                  Add Food to Your Plate
                </h3>
                <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "2px 0 0" }}>
                  Items from {data.cafeteriaName}
                </p>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                style={{ border: "none", background: "var(--surface-2)", width: 32, height: 32, borderRadius: 10, cursor: "pointer", fontSize: 16, color: "var(--txt)" }}
              >
                ✕
              </button>
            </div>

            {/* Category Filter */}
            <div style={{ padding: "12px 22px", display: "flex", gap: 6, overflowX: "auto", borderBottom: "1px solid var(--border)" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 700,
                    border: selectedCategory === cat ? "1px solid var(--primary)" : "1px solid var(--border)",
                    background: selectedCategory === cat ? "var(--primary)" : "var(--surface-2)",
                    color: selectedCategory === cat ? "#FFF" : "var(--txt-2)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu List */}
            <div style={{ padding: "16px 22px", overflowY: "auto", flex: 1 }} className="space-y-3">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, position: "relative", borderRadius: 12, overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
                      <Image
                        src={getItemImageUrl(item.imageUrl, item.name)}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "var(--txt)" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "var(--txt-muted)" }}>{item.category}</div>
                      <div style={{ fontWeight: 900, fontSize: 14, color: "var(--primary)", marginTop: 2 }}>৳{item.price}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddItem(item.id)}
                    disabled={itemAddingId === item.id || !item.isAvailable}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      background: item.isAvailable ? "var(--primary)" : "var(--border)",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: item.isAvailable ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Plus size={14} /> {itemAddingId === item.id ? "Adding..." : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Secure Split Payment Modal ── */}
      {isPayModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
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
              maxWidth: 460,
              width: "100%",
              padding: 24,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={22} color="#10B981" />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                  Secure Split Checkout
                </h3>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--txt-muted)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "var(--surface-2)", padding: 14, borderRadius: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--txt-muted)" }}>Your Allocated Share:</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)" }}>৳{currentUser.myTotalShare}</div>
              <div style={{ fontSize: 11, color: "var(--txt-muted)", marginTop: 4 }}>
                Includes individual food items + split cafeteria delivery share.
              </div>
            </div>

            <div style={{ marginBottom: 20 }} className="space-y-2">
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-2)", textTransform: "uppercase" }}>
                Select Payment Method
              </label>

              <button
                onClick={() => setPaymentMethod("BKASH")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: paymentMethod === "BKASH" ? "2px solid #E2136E" : "1px solid var(--border)",
                  background: paymentMethod === "BKASH" ? "rgba(226, 19, 110, 0.08)" : "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #E2136E", background: paymentMethod === "BKASH" ? "#E2136E" : "transparent" }} />
                  <span style={{ fontWeight: 700, color: "var(--txt)", fontSize: 14 }}>bKash Payment</span>
                </div>
                <span style={{ fontSize: 11, color: "#E2136E", fontWeight: 700 }}>Instant</span>
              </button>

              <button
                onClick={() => setPaymentMethod("NAGAD")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: paymentMethod === "NAGAD" ? "2px solid #F7941D" : "1px solid var(--border)",
                  background: paymentMethod === "NAGAD" ? "rgba(247, 148, 29, 0.08)" : "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #F7941D", background: paymentMethod === "NAGAD" ? "#F7941D" : "transparent" }} />
                  <span style={{ fontWeight: 700, color: "var(--txt)", fontSize: 14 }}>Nagad Payment</span>
                </div>
                <span style={{ fontSize: 11, color: "#F7941D", fontWeight: 700 }}>Instant</span>
              </button>

              <button
                onClick={() => setPaymentMethod("CARD")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: paymentMethod === "CARD" ? "2px solid #3B82F6" : "1px solid var(--border)",
                  background: paymentMethod === "CARD" ? "rgba(59, 130, 246, 0.08)" : "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #3B82F6", background: paymentMethod === "CARD" ? "#3B82F6" : "transparent" }} />
                  <span style={{ fontWeight: 700, color: "var(--txt)", fontSize: 14 }}>CoU Student Smart Card</span>
                </div>
                <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 700 }}>RFID / Balance</span>
              </button>

              <button
                onClick={() => setPaymentMethod("CASH_AT_COUNTER")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: paymentMethod === "CASH_AT_COUNTER" ? "2px solid #10B981" : "1px solid var(--border)",
                  background: paymentMethod === "CASH_AT_COUNTER" ? "rgba(16, 185, 129, 0.08)" : "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #10B981", background: paymentMethod === "CASH_AT_COUNTER" ? "#10B981" : "transparent" }} />
                  <span style={{ fontWeight: 700, color: "var(--txt)", fontSize: 14 }}>Cash to Host / Counter</span>
                </div>
                <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>Hand-to-Hand</span>
              </button>
            </div>

            <button
              onClick={handleExecutePayment}
              disabled={isPaying}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                background: "var(--primary)",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "var(--shadow-primary)",
              }}
            >
              {isPaying ? "Processing Secure Split..." : `Confirm Payment of ৳${currentUser.myTotalShare}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
