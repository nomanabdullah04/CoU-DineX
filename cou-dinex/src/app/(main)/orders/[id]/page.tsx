"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Utensils,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Phone,
  AlertCircle,
  Building,
  GraduationCap,
  XCircle,
  RotateCcw,
  Calendar,
  DollarSign,
  Info,
  Receipt,
  CreditCard,
  Search,
} from "lucide-react";
import { getItemImageUrl } from "@/lib/foodImages";
import { DemoPaymentModal } from "@/components/payment/DemoPaymentModal";
import { PaymentMethod } from "@/lib/payment/types";

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
  estimated?: boolean;
}

interface OrderTrackingData {
  id: string;
  orderNumber: string;
  status: string;
  deliveryType: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  canCancel: boolean;
  timeline: TimelineStep[];
  cafeteria: {
    id: string;
    name: string;
    location: string;
  };
  table?: {
    id: string;
    tableNumber: string;
  } | null;
  deliveryLocation?: {
    name: string;
    roomNumber: string | null;
    landmark: string | null;
    hall?: { name: string; code: string } | null;
    department?: { name: string; code: string } | null;
  } | null;
  orderItems: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string | null;
    menuItem: {
      id: string;
      name: string;
      imageUrl: string | null;
      preparationTimeMinutes: number;
    };
  }[];
  payment?: {
    method: string;
    status: string;
  } | null;
  deliveryTracking?: {
    status: string;
    estimatedDeliveryTime?: string | null;
    agent?: {
      user: {
        fullName: string;
        phone: string;
      };
    } | null;
  } | null;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { addItem } = useCart();

  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);
  const [reorderSuccess, setReorderSuccess] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);

  async function fetchOrder() {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error("Unable to retrieve order details");
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
    // Poll every 6 seconds for real-time live kitchen progress
    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Cancel order handler
  const handleCancelOrder = async () => {
    if (!orderId) return;
    setCancelling(true);
    setCancelFeedback(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelFeedback(data.error || "Cancellation failed");
        setCancelling(false);
        return;
      }
      setCancelModalOpen(false);
      fetchOrder();
    } catch (err) {
      setCancelFeedback("Network error while cancelling order");
    } finally {
      setCancelling(false);
    }
  };

  // Reorder handler
  const handleReorder = () => {
    if (!order) return;
    for (const item of order.orderItems) {
      addItem(
        {
          id: item.menuItem.id,
          name: item.menuItem.name,
          price: Number(item.unitPrice),
          originalPrice: Number(item.unitPrice),
          imageUrl: item.menuItem.imageUrl,
          cafeteriaId: order.cafeteria.id,
          cafeteriaName: order.cafeteria.name,
          preparationTimeMinutes: item.menuItem.preparationTimeMinutes || 15,
        },
        item.quantity
      );
    }
    setReorderSuccess(true);
    setTimeout(() => {
      router.push("/cart");
    }, 1200);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "80px auto", padding: "0 16px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--txt)" }}>
          Loading Order Status…
        </h2>
        <p style={{ fontSize: 14, color: "var(--txt-muted)" }}>
          Connecting with the Central Cafeteria system…
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 16px", textAlign: "center" }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "40px 24px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "var(--txt-muted)" }}>
            <Search size={38} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--txt)", margin: "0 0 8px 0" }}>
            Order Not Found
          </h2>
          <p style={{ fontSize: 14, color: "var(--txt-muted)", margin: "0 0 24px 0" }}>
            {error || "Could not find the requested order."}
          </p>
          <Link
            href="/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 12,
              background: "var(--primary)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} /> Return to Orders List
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "CANCELLED" || order.status === "REJECTED";
  const isDelivered = order.status === "DELIVERED";

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDestinationDisplay = () => {
    switch (order.deliveryType) {
      case "TABLE_QR":
        return `Eat Here — Table #${order.table?.tableNumber || "Open Dining Table"}`;
      case "CAFETERIA_PICKUP":
        return `Counter Pickup (${order.cafeteria.name})`;
      case "HALL_DELIVERY":
        return `Hall Delivery: ${order.deliveryLocation?.hall?.name || "Hall"} — Room ${order.deliveryLocation?.roomNumber || ""}`;
      case "DEPARTMENT_DELIVERY":
        return `Department Delivery: ${order.deliveryLocation?.department?.name || "Dept"} — Room ${order.deliveryLocation?.roomNumber || ""}`;
      default:
        return order.deliveryType;
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 80px 16px" }}>
      {/* Top Header Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <Link
          href="/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--txt-2)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          <span>All Orders</span>
        </Link>

        {/* Live Status Badge */}
        <span
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            background: isCancelled ? "#FEE2E2" : isDelivered ? "#D1FAE5" : "#FEF3C7",
            color: isCancelled ? "#DC2626" : isDelivered ? "#047857" : "#D97706",
            fontSize: 13,
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {!isCancelled && !isDelivered && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#D97706",
                display: "inline-block",
              }}
            />
          )}
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Main Order Card Banner */}
      <div
        style={{
          background: isCancelled
            ? "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"
            : isDelivered
            ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
            : "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
          borderRadius: 24,
          padding: "26px 24px",
          color: "#FFFFFF",
          marginBottom: 26,
          boxShadow: "0 10px 25px rgba(15, 118, 110, 0.22)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 12, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
              Campus Order
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: "2px 0 0 0", letterSpacing: "-0.01em" }}>
              #{order.orderNumber}
            </h1>
          </div>

          {/* Quick Actions in Banner */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Digital Receipt Button */}
            <Link
              href={`/orders/${order.id}/receipt`}
              target="_blank"
              style={{
                padding: "8px 14px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.22)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              <Receipt size={15} />
              <span>Digital Receipt</span>
            </Link>

            {/* Reorder Button */}
            <button
              onClick={handleReorder}
              style={{
                padding: "8px 16px",
                borderRadius: 12,
                background: "#FFFFFF",
                color: "var(--primary)",
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <RotateCcw size={15} />
              <span>{reorderSuccess ? "Added to Cart!" : "Reorder"}</span>
            </button>

            {/* Cancel Button (Enabled ONLY when allowed server-side) */}
            {order.canCancel && !isCancelled && (
              <button
                id="cancel-order-modal-trigger-btn"
                onClick={() => setCancelModalOpen(true)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.18)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 13,
                  border: "1px solid rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <XCircle size={15} />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick telemetry details */}
        <div
          style={{
            background: "rgba(255,255,255,0.14)",
            borderRadius: 14,
            padding: "12px 16px",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 13,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Building size={14} className="text-teal-600" />
            <strong>{order.cafeteria.name}</strong>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <MapPin size={14} className="text-teal-600" />
            <strong>{getDestinationDisplay()}</strong>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <DollarSign size={14} className="text-teal-600" />
            <strong>৳{order.totalAmount}</strong>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} className="text-teal-600" />
            <span>Placed: <strong>{formatTimestamp(order.createdAt)}</strong></span>
          </span>
        </div>
      </div>

      {/* Cancellation Notice if Cancelled */}
      {isCancelled && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 18,
            padding: "16px 20px",
            color: "#991B1B",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <XCircle size={22} color="#DC2626" />
          <div>
            <strong style={{ fontSize: 14 }}>This order has been cancelled.</strong>
            <p style={{ margin: "2px 0 0 0", fontSize: 13, opacity: 0.9 }}>
              All reserved item quantities have been safely restocked in the cafeteria inventory.
            </p>
          </div>
        </div>
      )}

      {/* Unpaid / Payment Pending Banner */}
      {!isCancelled && order.payment && order.payment.status !== "PAID" && (
        <div
          style={{
            background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
            border: "1px solid #F59E0B",
            borderRadius: 18,
            padding: "16px 20px",
            color: "#92400E",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#F59E0B",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <strong style={{ fontSize: 14, display: "block" }}>Payment Status: {order.payment.status}</strong>
              <p style={{ margin: "2px 0 0 0", fontSize: 13, opacity: 0.9 }}>
                {order.payment.method === "CASH_ON_DELIVERY"
                  ? "Pay cash directly to cafeteria staff or delivery rider upon receiving your meal."
                  : "Complete your simulated demo payment with bKash, Nagad, Rocket, or Card."}
              </p>
            </div>
          </div>

          {order.payment.method !== "CASH_ON_DELIVERY" && (
            <button
              onClick={() => setPayModalOpen(true)}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                background: "#0F766E",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(15, 118, 110, 0.25)",
              }}
            >
              <span>Pay Now (৳{order.totalAmount})</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* VISUAL STATUS TIMELINE WITH REAL TIMESTAMPS */}
      {!isCancelled && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 22,
            padding: "24px 20px",
            marginBottom: 24,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
              Visual Order Timeline &amp; Timestamps
            </h2>
            <span style={{ fontSize: 12, color: "var(--txt-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={13} /> Live auto-update active
            </span>
          </div>

          {/* Timeline Steps Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${order.timeline.length}, 1fr)`,
              gap: 8,
              position: "relative",
            }}
          >
            {order.timeline.map((step, idx) => {
              const isCurrent = step.key === order.status;
              const isCompleted = step.completed;

              return (
                <div
                  key={step.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  {/* Step Circle */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: isCurrent
                        ? "var(--primary)"
                        : isCompleted
                        ? "#059669"
                        : "var(--surface-2)",
                      color: isCompleted || isCurrent ? "#FFFFFF" : "var(--txt-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                      marginBottom: 8,
                      border: isCurrent ? "3px solid #CCFBF1" : "1px solid var(--border)",
                      boxShadow: isCurrent ? "0 0 0 3px var(--primary)" : "none",
                      transition: "all 200ms ease",
                    }}
                  >
                    {isCompleted && !isCurrent ? "✓" : idx + 1}
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? "var(--primary)" : "var(--txt)",
                      lineHeight: 1.2,
                      marginBottom: 3,
                    }}
                  >
                    {step.label}
                  </span>

                  {/* Timestamp Display */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: step.completed
                        ? "var(--primary)"
                        : step.estimated
                        ? "#0F766E"
                        : "var(--txt-muted)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: step.completed
                        ? "var(--primary-light)"
                        : step.estimated
                        ? "rgba(15, 118, 110, 0.08)"
                        : "transparent",
                      border: step.estimated ? "1px dashed rgba(15, 118, 110, 0.35)" : "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.timestamp
                      ? (step.estimated ? `Est. ${formatTimestamp(step.timestamp)}` : formatTimestamp(step.timestamp))
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cancellation Allowed / Disallowed Policy Note */}
          <div
            style={{
              marginTop: 20,
              padding: "10px 14px",
              borderRadius: 12,
              background: "var(--surface-2)",
              fontSize: 12,
              color: "var(--txt-muted)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Info size={15} color="var(--primary)" />
            {order.canCancel ? (
              <span>Order can be cancelled now. Once the kitchen starts preparing, cancellation is locked.</span>
            ) : isDelivered ? (
              <span>Order has been successfully fulfilled.</span>
            ) : (
              <span>Cooking/delivery is in progress. Order can no longer be cancelled.</span>
            )}
          </div>
        </div>
      )}

      {/* Items Breakdown */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 22,
          padding: "24px 20px",
          boxShadow: "var(--shadow-card)",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: "0 0 16px 0" }}>
          Order Items ({order.orderItems.length})
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {order.orderItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "var(--surface-2)",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={item.menuItem.imageUrl || getItemImageUrl(item.menuItem.name)}
                    alt={item.menuItem.name}
                    fill
                    className="object-cover"
                    sizes="52px"
                  />
                </div>

                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)", margin: "0 0 2px 0" }}>
                    {item.menuItem.name}
                  </h4>
                  <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: 0 }}>
                    {item.quantity} × ৳{item.unitPrice}
                    {item.specialInstructions && (
                      <span style={{ color: "var(--primary)", marginLeft: 6 }}>
                        (Note: {item.specialInstructions})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)" }}>
                ৳{item.totalPrice}
              </span>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-2)" }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600 }}>৳{order.subtotal}</span>
          </div>

          {order.discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
              <span>Discount</span>
              <span style={{ fontWeight: 600 }}>-৳{order.discount}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-2)" }}>
            <span>Delivery Fee</span>
            <span style={{ fontWeight: 600 }}>
              {order.deliveryFee === 0 ? "Free (৳0)" : `৳${order.deliveryFee}`}
            </span>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              marginTop: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)" }}>Total Bill</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)" }}>
              ৳{order.totalAmount}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Cancellation */}
      {cancelModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
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
              borderRadius: 20,
              padding: "26px 24px",
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertCircle size={24} color="#DC2626" />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                Cancel Order #{order.orderNumber}?
              </h3>
            </div>

            <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "0 0 20px 0", lineHeight: 1.5 }}>
              Are you sure you want to cancel this order? All reserved food items will be released back to the cafeteria inventory stock.
            </p>

            {cancelFeedback && (
              <div
                style={{
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                {cancelFeedback}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--txt)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Keep Order
              </button>

              <button
                id="confirm-cancel-order-btn"
                onClick={handleCancelOrder}
                disabled={cancelling}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  background: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor: cancelling ? "not-allowed" : "pointer",
                }}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Demo Payment Modal for Paying Pending Order */}
      {payModalOpen && order && order.payment && (
        <DemoPaymentModal
          isOpen={payModalOpen}
          orderId={order.id}
          orderNumber={order.orderNumber}
          amount={order.totalAmount}
          method={
            Object.values(PaymentMethod).includes(order.payment.method as PaymentMethod)
              ? (order.payment.method as PaymentMethod)
              : PaymentMethod.BKASH
          }
          onSuccess={(_receiptUrl) => {
            setPayModalOpen(false);
            fetchOrder();
          }}
          onCancel={() => setPayModalOpen(false)}
        />
      )}
    </div>
  );
}
