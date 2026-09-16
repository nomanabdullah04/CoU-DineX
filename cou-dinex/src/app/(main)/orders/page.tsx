"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  Utensils,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Building,
  GraduationCap,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { getItemImageUrl } from "@/lib/foodImages";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  deliveryType: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  createdAt: string;
  cafeteria: {
    id: string;
    name: string;
  };
  orderItems: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    menuItem: {
      id: string;
      name: string;
      imageUrl: string | null;
      preparationTimeMinutes?: number;
    };
  }[];
  payment?: {
    status: string;
    method: string;
  } | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");
  const [reorderedId, setReorderedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) {
        throw new Error("Unable to fetch your orders");
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel Order #${orderNumber}? Reserved stock will be restored.`)) {
      return;
    }
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to cancel order");
        return;
      }
      fetchOrders();
    } catch (err) {
      alert("Error cancelling order");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = (order: OrderSummary) => {
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
    setReorderedId(order.id);
    setTimeout(() => {
      router.push("/cart");
    }, 800);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Order Placed", bg: "#FEF3C7", text: "#D97706" };
      case "CONFIRMED":
        return { label: "Confirmed", bg: "#E0E7FF", text: "#4338CA" };
      case "PREPARING":
        return { label: "Cooking / Preparing", bg: "#DBEAFE", text: "#1D4ED8" };
      case "READY_FOR_PICKUP":
        return { label: "Ready for Pickup", bg: "#D1FAE5", text: "#059669" };
      case "OUT_FOR_DELIVERY":
        return { label: "Out for Delivery", bg: "#EDE9FE", text: "#6D28D9" };
      case "DELIVERED":
        return { label: "Delivered", bg: "#ECFDF5", text: "#047857" };
      case "CANCELLED":
      case "REJECTED":
        return { label: "Cancelled", bg: "#FEE2E2", text: "#B91C1C" };
      default:
        return { label: status, bg: "var(--surface-2)", text: "var(--txt)" };
    }
  };

  const getDeliveryTypeLabel = (type: string) => {
    switch (type) {
      case "TABLE_QR":
        return "Eat Here (Table)";
      case "CAFETERIA_PICKUP":
        return "Cafeteria Takeaway";
      case "HALL_DELIVERY":
        return "Hall Delivery";
      case "DEPARTMENT_DELIVERY":
        return "Department Delivery";
      default:
        return type;
    }
  };

  const activeOrders = orders.filter((o) =>
    ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status)
  );

  const filteredOrders = orders.filter((order) => {
    const isActive = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(
      order.status
    );
    if (filter === "ACTIVE") return isActive;
    if (filter === "COMPLETED") return order.status === "DELIVERED";
    if (filter === "CANCELLED") return order.status === "CANCELLED" || order.status === "REJECTED";
    return true;
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px 16px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--txt)", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
          My Orders &amp; Pre-Orders
        </h1>
        <p style={{ fontSize: 14, color: "var(--txt-muted)", margin: 0 }}>
          Track real-time cafeteria preparation, delivery status, and meal history.
        </p>
      </div>

      {/* Active Orders Highlight Banner if any */}
      {activeOrders.length > 0 && filter === "ALL" && (
        <div
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
            borderRadius: 20,
            padding: "20px 22px",
            color: "#FFFFFF",
            marginBottom: 26,
            boxShadow: "0 8px 24px rgba(15, 118, 110, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>
                Active Kitchen Order In Progress
              </span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 2px 0" }}>
              #{activeOrders[0].orderNumber} · {activeOrders[0].status.replace(/_/g, " ")}
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", margin: 0 }}>
              {activeOrders[0].orderItems.length} items from {activeOrders[0].cafeteria.name} · {getDeliveryTypeLabel(activeOrders[0].deliveryType)}
            </p>
          </div>

          <Link
            href={`/orders/${activeOrders[0].id}`}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#0F766E",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <span>Track Live Status</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
          overflowX: "auto",
        }}
      >
        {[
          { id: "ALL" as const, label: `All (${orders.length})` },
          { id: "ACTIVE" as const, label: `Active (${activeOrders.length})` },
          {
            id: "COMPLETED" as const,
            label: `Completed (${orders.filter((o) => o.status === "DELIVERED").length})`,
          },
          {
            id: "CANCELLED" as const,
            label: `Cancelled (${orders.filter((o) => o.status === "CANCELLED" || o.status === "REJECTED").length})`,
          },
        ].map((tab) => {
          const isSelected = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 12,
                border: "none",
                background: isSelected ? "var(--primary)" : "var(--surface-2)",
                color: isSelected ? "#FFFFFF" : "var(--txt-2)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 150ms ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content List */}
      {loading ? (
        <div style={{ padding: "60px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 14, color: "var(--txt-muted)" }}>Loading orders…</p>
        </div>
      ) : error ? (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 16,
            padding: "20px",
            color: "#B91C1C",
            textAlign: "center",
          }}
        >
          <AlertCircle size={24} style={{ margin: "0 auto 8px auto" }} />
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "60px 24px",
            textAlign: "center",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              fontSize: 32,
            }}
          >
            <ShoppingBag size={32} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--txt)", margin: "0 0 6px 0" }}>
            {filter === "ALL" ? "No Orders Yet" : "No Orders in this category"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--txt-muted)", maxWidth: 380, margin: "0 auto 20px auto" }}>
            Explore food items from Central Dining Hall and place an order to track it live here.
          </p>
          <Link
            href="/explore"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              borderRadius: 14,
              background: "var(--primary)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "var(--shadow-primary)",
            }}
          >
            <Utensils size={16} />
            <span>Browse Food Menu</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  padding: "20px 22px",
                  boxShadow: "var(--shadow-card)",
                  transition: "all 150ms ease",
                }}
              >
                {/* Top Row: Order Number & Status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", letterSpacing: "0.02em" }}>
                      #{order.orderNumber}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--txt-muted)", marginLeft: 10 }}>
                      {formattedDate}
                    </span>
                  </div>

                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: badge.bg,
                      color: badge.text,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Sub info: Cafeteria & Destination */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--txt-muted)", marginBottom: 16 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Building size={13} /> {order.cafeteria.name}
                  </span>
                  <span>•</span>
                  <span>{getDeliveryTypeLabel(order.deliveryType)}</span>
                </div>

                {/* Items preview with food photo */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 16 }}>
                  {order.orderItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 13,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ position: "relative", width: 32, height: 32, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
                          <Image
                            src={getItemImageUrl(item.menuItem.name)}
                            alt={item.menuItem.name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <span style={{ color: "var(--txt)", fontWeight: 500 }}>
                          {item.quantity}× {item.menuItem.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--txt)" }}>
                        ৳{item.totalPrice}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Row: Total & Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--border)",
                    paddingTop: 12,
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12, color: "var(--txt-muted)" }}>Total: </span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "var(--primary)" }}>
                      ৳{order.totalAmount}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Reorder Button */}
                    <button
                      onClick={() => handleReorder(order)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: 10,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--txt)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title="Add items to cart"
                    >
                      <RotateCcw size={13} />
                      <span>{reorderedId === order.id ? "Added!" : "Reorder"}</span>
                    </button>

                    {/* Cancel Order Button if eligible */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                        disabled={cancellingId === order.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 12px",
                          borderRadius: 10,
                          background: "#FEF2F2",
                          border: "1px solid #FCA5A5",
                          color: "#DC2626",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: cancellingId === order.id ? "not-allowed" : "pointer",
                        }}
                      >
                        <XCircle size={13} />
                        <span>{cancellingId === order.id ? "Cancelling..." : "Cancel"}</span>
                      </button>
                    )}

                    {/* Live Track Link */}
                    <Link
                      href={`/orders/${order.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 10,
                        background: "var(--primary)",
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(15, 118, 110, 0.25)",
                      }}
                    >
                      <span>Track Live</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
