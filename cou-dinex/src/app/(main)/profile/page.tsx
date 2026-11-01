"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  Award,
  Leaf,
  ShoppingBag,
  QrCode,
  Sparkles,
  ChevronRight,
  LogOut,
  Edit3,
  Building,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChefHat,
  Bike,
  ArrowRight,
  Sliders,
  X,
  Check,
  MapPin,
  Utensils,
  CreditCard,
  Compass,
  Star,
  Zap,
  Activity,
  Truck,
  ShieldAlert,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface UserProfile {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  student?: {
    id: string;
    universityStudentId: string;
    batch?: string | null;
    session?: string | null;
    verificationStatus: string;
    ecoScore: number;
    rewardPoints: number;
    department?: { name: string; code: string };
    hall?: { name: string; code: string };
  } | null;
  _count?: {
    orders: number;
    reviews: number;
  };
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number | string;
  menuItem?: { name: string; imageUrl?: string | null } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  deliveryType: string;
  createdAt: string;
  cafeteria?: { name: string } | null;
  orderItems: OrderItem[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { addItem } = useCart();

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ordersLoading, setOrdersLoading] = React.useState(true);

  // Modals & UI States
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [showWalletModal, setShowWalletModal] = React.useState(false);
  const [walletBalance, setWalletBalance] = React.useState(350);
  const [topupAmount, setTopupAmount] = React.useState("100");
  const [topupSuccess, setTopupSuccess] = React.useState(false);

  // Edit form state
  const [editName, setEditName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editAvatar, setEditAvatar] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Fetch current user profile
  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/profile");
          return;
        }
      }
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setEditName(data.user.fullName || "");
        setEditPhone(data.user.phone || "");
        setEditAvatar(data.user.avatarUrl || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch orders
  const fetchOrders = React.useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, [fetchProfile, fetchOrders]);

  // Identify active in-flight order for student
  const activeOrder = React.useMemo(() => {
    return orders.find((o) =>
      ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(
        o.status
      )
    );
  }, [orders]);

  // Past completed orders
  const pastOrders = React.useMemo(() => {
    return orders
      .filter((o) =>
        ["DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"].includes(o.status)
      )
      .slice(0, 3);
  }, [orders]);

  // Handle Profile Update
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editName,
          phone: editPhone,
          avatarUrl: editAvatar,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSaveSuccess(false);
          fetchProfile();
        }, 800);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update profile");
      }
    } catch {
      alert("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  }

  // Handle Logout
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  // Handle Wallet Demo Topup
  function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    const add = parseInt(topupAmount, 10) || 0;
    if (add > 0) {
      setWalletBalance((prev) => prev + add);
      setTopupSuccess(true);
      setTimeout(() => {
        setShowWalletModal(false);
        setTopupSuccess(false);
      }, 900);
    }
  }

  // 1-Tap Reorder (Foodpanda style)
  function handleReorder(order: Order) {
    if (!order.orderItems || order.orderItems.length === 0) {
      router.push("/explore");
      return;
    }
    order.orderItems.forEach((item) => {
      if (item.menuItem) {
        addItem(
          {
            id: item.id,
            name: item.menuItem.name,
            price: Number(item.unitPrice),
            originalPrice: Number(item.unitPrice),
            imageUrl: item.menuItem.imageUrl || null,
            cafeteriaId: "central-cafeteria",
            cafeteriaName: order.cafeteria?.name || "CoU Central Cafeteria",
            preparationTimeMinutes: 15,
          },
          item.quantity || 1
        );
      }
    });
    router.push("/cart");
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "3px solid #E2E8F0",
            borderTopColor: "#0F766E",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const role = profile?.role || "STUDENT";
  const isStudent = role === "STUDENT" || role === "VISITOR";
  const isRider = role === "DELIVERY_AGENT";
  const isAdmin = role === "SUPER_ADMIN" || role === "CAFETERIA_ADMIN";
  const isStaff = role === "CAFETERIA_STAFF";

  const student = profile?.student;
  const isVerified =
    student?.verificationStatus === "APPROVED" ||
    student?.verificationStatus === "VERIFIED";
  const ecoScore = student?.ecoScore || 45;
  const ordersCount = orders.length || profile?._count?.orders || 0;

  return (
    <div
      style={{
        maxWidth: 1060,
        margin: "0 auto",
        padding: "16px 16px 80px",
        fontFamily: "inherit",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════
          1. ACTIVE ORDER BANNER (Students with Meal in Progress)
         ══════════════════════════════════════════════════════════════ */}
      {isStudent && activeOrder && (
        <div
          style={{
            background: "linear-gradient(135deg, #042F2E 0%, #0F766E 60%, #115E59 100%)",
            borderRadius: 22,
            padding: "20px 22px",
            color: "#FFFFFF",
            boxShadow: "0 14px 30px -8px rgba(15, 118, 110, 0.35)",
            marginBottom: 22,
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#F43F5E",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 900,
                  padding: "4px 10px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                Live Order
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#FDE68A",
                  fontFamily: "monospace",
                }}
              >
                #{activeOrder.orderNumber}
              </span>
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Building size={14} color="#FDE68A" />
              {activeOrder.cafeteria?.name || "Central Cafeteria"}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 4px" }}>
              {activeOrder.status === "PENDING" && "Order Placed • Queued for Stove"}
              {activeOrder.status === "CONFIRMED" && "Kitchen Confirmed • Starting Prep"}
              {activeOrder.status === "PREPARING" && "Chef Cooking in Kitchen"}
              {activeOrder.status === "READY_FOR_PICKUP" && "Meal Ready • Counter / Rider Pickup"}
              {activeOrder.status === "OUT_FOR_DELIVERY" && "Rider Dispatched • On Campus Route"}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>
              {activeOrder.orderItems.length} item(s) • Total: <strong>৳{activeOrder.totalAmount}</strong>
            </p>
          </div>

          {/* Stepper */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.22)",
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 16,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              textAlign: "center",
            }}
          >
            {[
              { label: "Confirmed", done: true },
              {
                label: "Cooking",
                done: ["PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(activeOrder.status),
              },
              {
                label: "Rider Transit",
                done: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(activeOrder.status),
              },
              { label: "Arrived", done: activeOrder.status === "DELIVERED" },
            ].map((step, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: step.done ? "#10B981" : "rgba(255,255,255,0.2)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {step.done ? "✓" : idx + 1}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: step.done ? "#A7F3D0" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Dedicated Tracking Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Link
              href={`/orders/${activeOrder.id}`}
              style={{
                background: "#FFFFFF",
                color: "#0F766E",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 13,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bike size={18} color="#0284C7" />
                <span>Rider Live Location</span>
              </div>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/kitchen"
              style={{
                background: "rgba(255, 255, 255, 0.14)",
                color: "#FFFFFF",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 13,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ChefHat size={18} color="#FDE68A" />
                <span>Kitchen Live Radar</span>
              </div>
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          2. MAIN USER PROFILE CARD & STATS
         ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 22,
        }}
      >
        {/* ──────────────────────────────────────────────────────────
            LEFT: DYNAMIC SMART CARD (Student / Rider / Admin Pass)
           ────────────────────────────────────────────────────────── */}
        <div>
          <div
            style={{
              position: "relative",
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 18px 36px -12px rgba(15, 118, 110, 0.28)",
              background: isRider
                ? "linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0369A1 100%)"
                : isAdmin
                ? "linear-gradient(135deg, #1E1B4B 0%, #4C1D95 50%, #6D28D9 100%)"
                : isStaff
                ? "linear-gradient(135deg, #451A03 0%, #B45309 50%, #D97706 100%)"
                : "linear-gradient(135deg, #0A3A40 0%, #0F766E 45%, #064E3B 100%)",
              color: "#FFFFFF",
              padding: "24px 22px",
              border: "1px solid rgba(255, 255, 255, 0.18)",
            }}
          >
            {/* Header Monogram */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid rgba(255,255,255,0.18)",
                paddingBottom: 14,
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 10, letterSpacing: "1.2px", textTransform: "uppercase", color: "#FDE68A", fontWeight: 800 }}>
                  কুমিল্লা বিশ্ববিদ্যালয়
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, marginTop: 2 }}>
                  COMILLA UNIVERSITY
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                  {isRider && "Campus Delivery Partner Pass"}
                  {isAdmin && "Dining Administration Pass"}
                  {isStaff && "Kitchen Operations Pass"}
                  {isStudent && "Smart Dining & Campus Access"}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(6px)",
                  padding: "5px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Sparkles size={13} color="#F59E0B" />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#FEF3C7" }}>
                  {isRider ? "Rider Pass" : isAdmin ? "Admin Key" : isStaff ? "Staff Key" : "Student Pass"}
                </span>
              </div>
            </div>

            {/* Avatar & Core Identity */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
              <div
                style={{
                  position: "relative",
                  width: 68,
                  height: 68,
                  borderRadius: 18,
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  padding: 2.5,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    background: "#0F766E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    overflow: "hidden",
                  }}
                >
                  {profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    profile?.fullName?.charAt(0) || "U"
                  )}
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: -3,
                    right: -3,
                    background: "#10B981",
                    color: "white",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #064E3B",
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: 19,
                    fontWeight: 900,
                    margin: "0 0 3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {profile?.fullName}
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      padding: "2px 7px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      fontFamily: "monospace",
                    }}
                  >
                    {isRider
                      ? "RIDER-01"
                      : isAdmin
                      ? "ADMIN-SUPER"
                      : isStaff
                      ? "STAFF-CHEF"
                      : `ID: ${student?.universityStudentId || "11908004"}`}
                  </span>

                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.25)",
                      border: "1px solid rgba(16, 185, 129, 0.5)",
                      color: "#A7F3D0",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <ShieldCheck size={11} />
                    {isRider ? "ACTIVE RIDER" : isAdmin ? "SUPER ADMIN" : isStaff ? "KITCHEN CHEF" : "VERIFIED"}
                  </span>
                </div>
              </div>
            </div>

            {/* Matrix Data Grid */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.22)",
                borderRadius: 14,
                padding: "12px 14px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {isStudent && (
                <>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                      Department
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: "#FFFFFF" }}>
                      {student?.department?.name || "Computer Science (CSE)"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                      Hall
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: "#FFFFFF" }}>
                      {student?.hall?.name || "Bangabandhu Hall"}
                    </div>
                  </div>
                </>
              )}

              {isRider && (
                <>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                      Coverage Zone
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: "#FFFFFF" }}>
                      Halls & Science Faculty
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                      Vehicle
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: "#FFFFFF" }}>
                      Campus Bicycle #04
                    </div>
                  </div>
                </>
              )}

              {isAdmin && (
                <>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                      Authority
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: "#FFFFFF" }}>
                      Full Dining & POS Access
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                      Cafeterias
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: "#FFFFFF" }}>
                      Central & Canteens (3)
                    </div>
                  </div>
                </>
              )}

              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                  Contact
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: "#FFFFFF" }}>
                  {profile?.phone || "017XXXXXXXX"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                  Account Role
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: "#FEF08A" }}>
                  {role}
                </div>
              </div>
            </div>

            {/* Quick Portal Action inside Card */}
            <div style={{ display: "flex", gap: 8 }}>
              {isRider && (
                <Link
                  href="/delivery"
                  style={{
                    flex: 1,
                    background: "#FFFFFF",
                    color: "#1D4ED8",
                    padding: "10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Bike size={16} /> Open Rider Portal
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  style={{
                    flex: 1,
                    background: "#FFFFFF",
                    color: "#6D28D9",
                    padding: "10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <ShieldAlert size={16} /> Admin Console
                </Link>
              )}

              {isStaff && (
                <Link
                  href="/kitchen"
                  style={{
                    flex: 1,
                    background: "#FFFFFF",
                    color: "#B45309",
                    padding: "10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <ChefHat size={16} /> Kitchen KDS Screen
                </Link>
              )}

              {isStudent && (
                <button
                  onClick={() => setShowQrModal(true)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.25)",
                    padding: "9px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <QrCode size={15} /> Show Dining QR
                </button>
              )}
            </div>
          </div>

          {/* Edit Info & Logout Bar */}
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button
              onClick={() => setIsEditModalOpen(true)}
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 12,
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#1E293B",
                fontSize: 13,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Edit3 size={15} />
              Edit Profile
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: "11px 16px",
                borderRadius: 12,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
                fontSize: 13,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────
            RIGHT: ROLE-TAILORED PERFORMANCE & METRIC TILES
           ────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Trio Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {/* Tile 1 */}
            <div
              onClick={() => isStudent && setShowWalletModal(true)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 18,
                padding: "14px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                cursor: isStudent ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0284C7", marginBottom: 4 }}>
                {isRider ? <Truck size={16} /> : isAdmin ? <Activity size={16} /> : <CreditCard size={16} />}
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                  {isRider ? "Deliveries" : isAdmin ? "Cafeterias" : "Wallet"}
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>
                {isRider ? "18 Today" : isAdmin ? "3 Active" : `৳ ${walletBalance}`}
              </div>
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginTop: 2 }}>
                {isRider ? "100% on time" : isAdmin ? "All Systems Go" : "+ Instant Reload"}
              </div>
            </div>

            {/* Tile 2 */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 18,
                padding: "14px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#16A34A", marginBottom: 4 }}>
                {isRider ? <Star size={16} color="#EAB308" /> : isAdmin ? <Zap size={16} /> : <Leaf size={16} />}
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                  {isRider ? "Rating" : isAdmin ? "Live Orders" : "Eco Score"}
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>
                {isRider ? "4.9 ⭐" : isAdmin ? "6 Cooking" : `${ecoScore}/100`}
              </div>
              <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700, marginTop: 2 }}>
                {isRider ? "Top Rated Courier" : isAdmin ? "Kitchen Stove Queue" : "Silver Green Tier"}
              </div>
            </div>

            {/* Tile 3 */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 18,
                padding: "14px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0F766E", marginBottom: 4 }}>
                <ShoppingBag size={16} />
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                  {isRider ? "Earnings" : isAdmin ? "Volume" : "Orders"}
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F766E" }}>
                {isRider ? "৳ 720" : isAdmin ? "৳ 18,450" : ordersCount}
              </div>
              <Link
                href={isRider ? "/delivery" : isAdmin ? "/admin" : "/orders"}
                style={{
                  fontSize: 10,
                  color: "#0F766E",
                  fontWeight: 800,
                  marginTop: 2,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                {isRider ? "View Shifts →" : isAdmin ? "View Analytics →" : "View History →"}
              </Link>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              STUDENT VIEW: Recent Orders & 1-Tap Reorder
             ────────────────────────────────────────────────────────── */}
          {isStudent && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 20,
                padding: "18px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={16} color="#0F766E" />
                  Past Orders & 1-Tap Reorder
                </div>
                <Link href="/orders" style={{ fontSize: 12, fontWeight: 700, color: "#0F766E", textDecoration: "none" }}>
                  All
                </Link>
              </div>

              {ordersLoading ? (
                <div style={{ textAlign: "center", padding: "12px", fontSize: 12, color: "#94A3B8" }}>
                  Loading orders...
                </div>
              ) : pastOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px", background: "#F8FAFC", borderRadius: 12, color: "#64748B", fontSize: 12 }}>
                  No past orders. Explore menu to place your first meal!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pastOrders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: 14,
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {order.orderItems?.map((i) => i.menuItem?.name || "Dish").join(", ") || "Meal Order"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                          <span>{order.cafeteria?.name || "Central Cafeteria"}</span>
                          <span>•</span>
                          <strong>৳{order.totalAmount}</strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleReorder(order)}
                          style={{
                            background: "#0F766E",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <RefreshCw size={11} /> Reorder
                        </button>
                        <Link
                          href={`/orders/${order.id}`}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            color: "#475569",
                            padding: "6px 8px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          Receipt
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              RIDER VIEW: Quick Delivery Tools
             ────────────────────────────────────────────────────────── */}
          {isRider && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 20,
                padding: "18px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Bike size={16} color="#1D4ED8" />
                Rider Delivery Controls
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link
                  href="/delivery"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#EFF6FF",
                    border: "1px solid #DBEAFE",
                    textDecoration: "none",
                    color: "#1D4ED8",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  <span>Active Delivery Dispatch Queue</span>
                  <ArrowRight size={15} />
                </Link>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  <span>Dispatch Hotline: <strong>01700000000</strong></span>
                  <span style={{ color: "#10B981", fontWeight: 700 }}>24/7 Available</span>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              ADMIN VIEW: Management Quick Access
             ────────────────────────────────────────────────────────── */}
          {isAdmin && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 20,
                padding: "18px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={16} color="#6D28D9" />
                Campus Dining Administration
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Link
                  href="/admin"
                  style={{
                    padding: "12px",
                    borderRadius: 12,
                    background: "#F5F3FF",
                    border: "1px solid #EDE9FE",
                    textDecoration: "none",
                    color: "#6D28D9",
                    fontWeight: 800,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Operations Console
                </Link>

                <Link
                  href="/kitchen"
                  style={{
                    padding: "12px",
                    borderRadius: 12,
                    background: "#FFFBEB",
                    border: "1px solid #FEF3C7",
                    textDecoration: "none",
                    color: "#B45309",
                    fontWeight: 800,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Kitchen KDS
                </Link>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              CAMPUS SERVICES HUB
             ────────────────────────────────────────────────────────── */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 20,
              padding: "18px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
              Campus Dining Links
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href="/map"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "#F8FAFC",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1E293B",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Compass size={16} color="#059669" />
                  <span>Campus Cafeteria Map & Tables</span>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </Link>

              <Link
                href="/class-schedule"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "#F8FAFC",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1E293B",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar size={16} color="#4F46E5" />
                  <span>Class Routine & Meal Sync</span>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </Link>

              <Link
                href="/settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "#F8FAFC",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1E293B",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sliders size={16} color="#475569" />
                  <span>Preferences & Settings</span>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. EDIT PROFILE MODAL
         ══════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 22,
              padding: "24px 22px",
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748B",
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px", color: "#0F172A" }}>
              Edit Profile Info
            </h3>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 16px" }}>
              Update your name, phone number, and avatar image.
            </p>

            {saveSuccess && (
              <div
                style={{
                  background: "#DCFCE7",
                  border: "1px solid #BBF7D0",
                  color: "#16A34A",
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCircle2 size={15} /> Updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    background: "#F1F5F9",
                    border: "none",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    background: "#0F766E",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          4. DINING QR MODAL
         ══════════════════════════════════════════════════════════════ */}
      {showQrModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 22,
              padding: "24px 20px",
              width: "100%",
              maxWidth: 340,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748B",
              }}
            >
              <X size={15} />
            </button>

            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px", color: "#0F172A" }}>
              Student Dining QR
            </h3>

            <div
              style={{
                display: "inline-block",
                padding: 12,
                borderRadius: 12,
                border: "2px solid #0F766E",
                background: "#F8FAFC",
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 140,
                  background: "conic-gradient(from 45deg, #0F766E 0% 25%, #FFFFFF 25% 50%, #0F766E 50% 75%, #FFFFFF 75% 100%)",
                  backgroundSize: "14px 14px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: "#0F766E",
                    color: "white",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  CoU
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F766E", marginTop: 12 }}>
              Scan at Cafeteria Counter
            </div>
            <p style={{ fontSize: 11, color: "#64748B", margin: "4px 0 0" }}>
              Instant student meal token & eco verification
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          5. WALLET RELOAD MODAL
         ══════════════════════════════════════════════════════════════ */}
      {showWalletModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 22,
              padding: "24px 20px",
              width: "100%",
              maxWidth: 360,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowWalletModal(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748B",
              }}
            >
              <X size={15} />
            </button>

            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px", color: "#0F172A" }}>
              DineX Campus Wallet
            </h3>

            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 14,
                padding: "12px",
                marginBottom: 14,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, color: "#166534", fontWeight: 700 }}>CURRENT BALANCE</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#15803D" }}>৳ {walletBalance}.00</div>
            </div>

            {topupSuccess && (
              <div
                style={{
                  background: "#DCFCE7",
                  border: "1px solid #BBF7D0",
                  color: "#16A34A",
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                ✓ Reloaded successfully!
              </div>
            )}

            <form onSubmit={handleTopup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {["50", "100", "200"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    style={{
                      padding: "8px",
                      borderRadius: 8,
                      border: topupAmount === amt ? "2px solid #0F766E" : "1px solid #CBD5E1",
                      background: topupAmount === amt ? "#CCFBF1" : "#FFFFFF",
                      color: topupAmount === amt ? "#0F766E" : "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    ৳ {amt}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                style={{
                  padding: "11px",
                  borderRadius: 10,
                  background: "#0F766E",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Top Up Balance
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
