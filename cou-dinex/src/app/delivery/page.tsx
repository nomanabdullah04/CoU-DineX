"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import {
  Bike,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  KeyRound,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  LogOut,
  Navigation,
  DollarSign,
  Utensils,
  ShieldCheck,
} from "lucide-react";

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: string;
  deliveryType: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  user: {
    fullName: string;
    phone: string;
  };
  cafeteria: {
    name: string;
    location: string;
  };
  deliveryLocation: {
    roomNumber: string | null;
    landmark: string | null;
    hall?: { name: string; code: string } | null;
    department?: { name: string; code: string } | null;
  } | null;
  orderItems: {
    id: string;
    quantity: number;
    unitPrice: number;
    menuItem: {
      name: string;
      imageUrl: string | null;
    };
  }[];
  payment?: {
    method: string;
    status: string;
    amount: number;
  } | null;
  deliveryTracking?: {
    id: string;
    status: string;
    pickupTime: string | null;
    estimatedDeliveryTime: string | null;
    actualDeliveryTime: string | null;
    currentLatitude: number | null;
    currentLongitude: number | null;
    isOtpVerified: boolean;
  } | null;
}

interface AgentProfile {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  licenseNumber: string;
  isAvailable: boolean;
}

export default function DeliveryDashboardPage() {
  const router = useRouter();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<DeliveryOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "AVAILABLE" | "COMPLETED">("ACTIVE");

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification Modal State
  const [otpModalOrder, setOtpModalOrder] = useState<DeliveryOrder | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpVerifying, setOtpVerifying] = useState(false);

  async function fetchDeliveryData() {
    try {
      const res = await fetch("/api/delivery/orders");
      if (res.status === 401 || res.status === 403) {
        router.push("/auth/login?redirect=/delivery");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load delivery orders");

      setAgent(data.agent);
      setActiveDeliveries(data.activeDeliveries || []);
      setAvailableOrders(data.availableOrders || []);
      setCompletedDeliveries(data.completedDeliveries || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeliveryData();
    // Auto-refresh delivery queue every 8 seconds
    const interval = setInterval(fetchDeliveryData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handle Rider Action (ACCEPT, PICKUP, START)
  const handleAction = async (orderId: string, action: "ACCEPT" | "PICKUP" | "START") => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch("/api/delivery/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      await fetchDeliveryData();
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle OTP Verified Handover (COMPLETE)
  const handleVerifyOtpAndComplete = async () => {
    if (!otpModalOrder) return;
    if (enteredOtp.length !== 4) {
      setOtpError("Please enter the 4-digit OTP provided by the student.");
      return;
    }

    setOtpVerifying(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/delivery/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: otpModalOrder.id,
          action: "COMPLETE",
          otp: enteredOtp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Handover verification failed");

      setOtpModalOrder(null);
      setEnteredOtp("");
      await fetchDeliveryData();
    } catch (err: any) {
      setOtpError(err.message || "Invalid OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  // Broadcast Simulated Location Update
  const handleUpdateLocation = async (orderId: string) => {
    try {
      // Simulate moving closer along campus avenue towards destination
      const res = await fetch("/api/delivery/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          latitude: 23.4198 + (Math.random() - 0.5) * 0.0005,
          longitude: 91.1378 + (Math.random() - 0.5) * 0.0005,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Location update failed");
      alert("📍 Location broadcasted to student map!");
      fetchDeliveryData();
    } catch (err: any) {
      alert(err.message || "Could not update location");
    }
  };

  const getDestinationDisplay = (order: DeliveryOrder) => {
    if (order.deliveryLocation?.hall) {
      return `🏠 ${order.deliveryLocation.hall.name} — Room ${order.deliveryLocation.roomNumber || "Not specified"}`;
    }
    if (order.deliveryLocation?.department) {
      return `🏫 ${order.deliveryLocation.department.name} — Room/Lab ${order.deliveryLocation.roomNumber || "Not specified"}`;
    }
    return "Campus Delivery Point";
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "100px auto", textAlign: "center", color: "var(--txt)" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🛵</div>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Loading Delivery Dispatch Portal...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 80px 16px" }}>
      {/* Top Header */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: "20px 24px",
          marginBottom: 24,
          boxShadow: "var(--shadow-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo size="md" href="/delivery" />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "var(--txt)" }}>
                Rider Dispatch Portal
              </h1>
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: 12,
                  background: "#D1FAE5",
                  color: "#065F46",
                  fontSize: 11,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669" }} />
                Active Shift
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "var(--txt-muted)" }}>
              {agent?.name} • {agent?.vehicleType}
            </p>
          </div>
        </div>

        {/* Right Quick Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/campus-map"
            target="_blank"
            style={{
              padding: "8px 14px",
              borderRadius: 12,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--txt)",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Navigation size={15} color="var(--primary)" />
            <span>Campus Map</span>
          </Link>

          <button
            onClick={fetchDeliveryData}
            style={{
              padding: "8px 14px",
              borderRadius: 12,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--txt)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshCw size={14} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div
          onClick={() => setActiveTab("ACTIVE")}
          style={{
            background: activeTab === "ACTIVE" ? "#CCFBF1" : "var(--surface)",
            border: activeTab === "ACTIVE" ? "2px solid #0F766E" : "1px solid var(--border)",
            borderRadius: 18,
            padding: "16px 20px",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-muted)", display: "block" }}>
            Active Assigned
          </span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#0F766E" }}>
            {activeDeliveries.length}
          </span>
        </div>

        <div
          onClick={() => setActiveTab("AVAILABLE")}
          style={{
            background: activeTab === "AVAILABLE" ? "#FEF3C7" : "var(--surface)",
            border: activeTab === "AVAILABLE" ? "2px solid #D97706" : "1px solid var(--border)",
            borderRadius: 18,
            padding: "16px 20px",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-muted)", display: "block" }}>
            Available for Pickup
          </span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#D97706" }}>
            {availableOrders.length}
          </span>
        </div>

        <div
          onClick={() => setActiveTab("COMPLETED")}
          style={{
            background: activeTab === "COMPLETED" ? "#EDE9FE" : "var(--surface)",
            border: activeTab === "COMPLETED" ? "2px solid #6D28D9" : "1px solid var(--border)",
            borderRadius: 18,
            padding: "16px 20px",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-muted)", display: "block" }}>
            Delivered Today
          </span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#6D28D9" }}>
            {completedDeliveries.length}
          </span>
        </div>
      </div>

      {/* TAB 1: ACTIVE ASSIGNED DELIVERIES */}
      {activeTab === "ACTIVE" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
              Active In-Hand Deliveries ({activeDeliveries.length})
            </h2>
            <span style={{ fontSize: 12, color: "var(--txt-muted)" }}>
              Requires Handover OTP verification at student destination
            </span>
          </div>

          {activeDeliveries.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px dashed var(--border)",
                borderRadius: 20,
                padding: "48px 24px",
                textAlign: "center",
                color: "var(--txt-muted)",
              }}
            >
              <Bike size={36} style={{ margin: "0 auto 10px auto", opacity: 0.6 }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: "0 0 4px 0" }}>
                No active deliveries right now
              </h3>
              <p style={{ fontSize: 13, margin: 0 }}>
                Check the "Available for Pickup" tab to accept orders ready at Central Cafeteria.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {activeDeliveries.map((order) => {
                const trackingStatus = order.deliveryTracking?.status || "ASSIGNED";
                const isPickedUp = trackingStatus === "PICKED_UP";
                const isOnTheWay = trackingStatus === "ON_THE_WAY";

                return (
                  <div
                    key={order.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      padding: "22px 20px",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: 14,
                        paddingBottom: 12,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>
                          Order Ticket
                        </span>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--txt)", margin: "2px 0 0 0" }}>
                          #{order.orderNumber}
                        </h3>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 16,
                            background: isOnTheWay ? "#FEF3C7" : isPickedUp ? "#CCFBF1" : "#E2E8F0",
                            color: isOnTheWay ? "#D97706" : isPickedUp ? "#0F766E" : "#334155",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {trackingStatus.replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)" }}>
                          ৳{order.totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Location */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      {/* Destination */}
                      <div
                        style={{
                          background: "var(--surface-2)",
                          padding: "12px 14px",
                          borderRadius: 14,
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={13} color="#DC2626" /> Drop-off Destination
                        </span>
                        <strong style={{ fontSize: 13, color: "var(--txt)", display: "block", marginTop: 4 }}>
                          {getDestinationDisplay(order)}
                        </strong>
                        {order.deliveryLocation?.landmark && (
                          <span style={{ fontSize: 12, color: "var(--txt-muted)", display: "block", marginTop: 2 }}>
                            Near: {order.deliveryLocation.landmark}
                          </span>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div
                        style={{
                          background: "var(--surface-2)",
                          padding: "12px 14px",
                          borderRadius: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)" }}>
                            Student Recipient
                          </span>
                          <strong style={{ fontSize: 13, color: "var(--txt)", display: "block", marginTop: 2 }}>
                            {order.user.fullName}
                          </strong>
                          <span style={{ fontSize: 12, color: "var(--txt-muted)" }}>
                            {order.user.phone}
                          </span>
                        </div>

                        <a
                          href={`tel:${order.user.phone}`}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            background: "#0F766E",
                            color: "#FFFFFF",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Phone size={13} /> Call
                        </a>
                      </div>
                    </div>

                    {/* Food Items */}
                    <div style={{ marginBottom: 18 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-muted)", display: "block", marginBottom: 6 }}>
                        Package Contents:
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {order.orderItems.map((item) => (
                          <span
                            key={item.id}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 8,
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              fontSize: 12,
                              color: "var(--txt)",
                              fontWeight: 600,
                            }}
                          >
                            <strong>{item.quantity}x</strong> {item.menuItem.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rider Step Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 10,
                        paddingTop: 12,
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--txt-muted)" }}>
                        <ShieldCheck size={16} color="#0F766E" />
                        <span>Payment: <strong>{order.payment?.status === "PAID" ? "Paid Online" : "Cash on Delivery"}</strong></span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Step 1: Mark Picked Up */}
                        {trackingStatus === "ASSIGNED" && (
                          <button
                            onClick={() => handleAction(order.id, "PICKUP")}
                            disabled={actionLoadingId === order.id}
                            style={{
                              padding: "10px 18px",
                              borderRadius: 12,
                              background: "#0F766E",
                              color: "#FFFFFF",
                              fontSize: 13,
                              fontWeight: 800,
                              border: "none",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Package size={16} />
                            <span>Mark Picked Up from Kitchen</span>
                          </button>
                        )}

                        {/* Step 2: Start Delivery (On the way) */}
                        {trackingStatus === "PICKED_UP" && (
                          <button
                            onClick={() => handleAction(order.id, "START")}
                            disabled={actionLoadingId === order.id}
                            style={{
                              padding: "10px 18px",
                              borderRadius: 12,
                              background: "#D97706",
                              color: "#FFFFFF",
                              fontSize: 13,
                              fontWeight: 800,
                              border: "none",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Bike size={16} />
                            <span>Start Transit (On the Way)</span>
                          </button>
                        )}

                        {/* Step 3: Transit active -> can update location or verify OTP to complete */}
                        {trackingStatus === "ON_THE_WAY" && (
                          <>
                            <button
                              onClick={() => handleUpdateLocation(order.id)}
                              style={{
                                padding: "10px 14px",
                                borderRadius: 12,
                                background: "var(--surface-2)",
                                border: "1px solid var(--border)",
                                color: "var(--txt)",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Navigation size={15} color="var(--primary)" />
                              <span>Ping GPS</span>
                            </button>

                            <button
                              onClick={() => {
                                setOtpModalOrder(order);
                                setEnteredOtp("");
                                setOtpError(null);
                              }}
                              style={{
                                padding: "10px 20px",
                                borderRadius: 12,
                                background: "#059669",
                                color: "#FFFFFF",
                                fontSize: 13,
                                fontWeight: 800,
                                border: "none",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                              }}
                            >
                              <KeyRound size={16} />
                              <span>Verify OTP &amp; Complete Handover</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABLE ORDERS WAITING FOR PICKUP */}
      {activeTab === "AVAILABLE" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
              Available Campus Delivery Tickets ({availableOrders.length})
            </h2>
            <span style={{ fontSize: 12, color: "var(--txt-muted)" }}>
              Ready or cooking at Central Cafeteria counter
            </span>
          </div>

          {availableOrders.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px dashed var(--border)",
                borderRadius: 20,
                padding: "48px 24px",
                textAlign: "center",
                color: "var(--txt-muted)",
              }}
            >
              <Package size={36} style={{ margin: "0 auto 10px auto", opacity: 0.6 }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: "0 0 4px 0" }}>
                No pending delivery tickets
              </h3>
              <p style={{ fontSize: 13, margin: 0 }}>
                All delivery orders currently have assigned riders.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {availableOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 14,
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 16, color: "var(--txt)" }}>
                        #{order.orderNumber}
                      </strong>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: "#FEF3C7",
                          color: "#92400E",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700, display: "block", marginTop: 4 }}>
                      {getDestinationDisplay(order)}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--txt-muted)", display: "block", marginTop: 2 }}>
                      {order.orderItems.length} items • Total: ৳{order.totalAmount} • Recipient: {order.user.fullName}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAction(order.id, "ACCEPT")}
                    disabled={actionLoadingId === order.id}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 12,
                      background: "#0F766E",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>Accept Delivery</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED DELIVERIES */}
      {activeTab === "COMPLETED" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
              Recent Completed Handover History ({completedDeliveries.length})
            </h2>
          </div>

          {completedDeliveries.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px dashed var(--border)",
                borderRadius: 20,
                padding: "48px 24px",
                textAlign: "center",
                color: "var(--txt-muted)",
              }}
            >
              <CheckCircle2 size={36} style={{ margin: "0 auto 10px auto", opacity: 0.6 }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: "0 0 4px 0" }}>
                No completed deliveries yet today
              </h3>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {completedDeliveries.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 15, color: "var(--txt)" }}>
                        #{order.orderNumber}
                      </strong>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: "#D1FAE5",
                          color: "#065F46",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        ✓ Delivered (OTP Verified)
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--txt-muted)", display: "block", marginTop: 4 }}>
                      {getDestinationDisplay(order)} • Recipient: {order.user.fullName}
                    </span>
                  </div>

                  <span style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)" }}>
                    ৳{order.payment?.amount || order.totalAmount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OTP HANDOVER VERIFICATION MODAL */}
      {otpModalOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 24,
              padding: "30px 26px",
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#CCFBF1",
                color: "#0F766E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <KeyRound size={26} />
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 900, color: "var(--txt)", margin: "0 0 6px 0" }}>
              Secure Handover Verification
            </h3>
            <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "0 0 20px 0", lineHeight: 1.4 }}>
              Ask student <strong>{otpModalOrder.user.fullName}</strong> for their 4-digit Delivery Handover OTP to confirm package handover.
            </p>

            {otpError && (
              <div
                style={{
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  fontSize: 13,
                  padding: "10px 14px",
                  borderRadius: 12,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{otpError}</span>
              </div>
            )}

            {/* OTP Input Box */}
            <input
              type="text"
              maxLength={4}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="0 0 0 0"
              style={{
                width: "100%",
                height: 56,
                fontSize: 28,
                fontWeight: 900,
                textAlign: "center",
                letterSpacing: "0.35em",
                borderRadius: 14,
                border: "2px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--txt)",
                outline: "none",
                marginBottom: 20,
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setOtpModalOrder(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--txt)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleVerifyOtpAndComplete}
                disabled={otpVerifying || enteredOtp.length !== 4}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: 12,
                  background: enteredOtp.length === 4 ? "#059669" : "#94A3B8",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: enteredOtp.length === 4 ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {otpVerifying ? "Verifying..." : "Verify & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
