"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Receipt,
  Utensils,
  Home,
  Building,
  MapPin,
  CreditCard,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

interface OrderSuccessProps {
  order: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    paymentMethod: string;
    cafeteriaName: string;
    deliveryType: string;
    isDemo: boolean;
  };
  onOrderMore: () => void;
}

export function OrderSuccessView({ order, onOrderMore }: OrderSuccessProps) {
  const getDestinationLabel = (type: string) => {
    switch (type) {
      case "EAT_HERE":
      case "TABLE_QR":
        return "Eat Here (Dine-in Table)";
      case "TAKE_AWAY":
      case "CAFETERIA_PICKUP":
        return "Counter Pickup / Takeaway";
      case "HALL_DELIVERY":
        return "Hall Delivery";
      case "DEPARTMENT_DELIVERY":
        return "Department / Classroom Delivery";
      default:
        return type;
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "30px auto 80px auto", padding: "0 16px" }}>
      {/* Top Celebratory Hero Card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 28,
          padding: "44px 28px 36px 28px",
          textAlign: "center",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 240,
            height: 120,
            background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Animated Green Check Badge */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
            border: "3px solid #10B981",
            color: "#059669",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.25)",
          }}
        >
          <CheckCircle2 size={44} />
        </div>

        {/* Top Tag */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(16, 185, 129, 0.12)",
            color: "#047857",
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <Sparkles size={14} />
          Order Placed Successfully
        </span>

        {/* Headline */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "var(--txt)",
            margin: "0 0 10px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Thank You! Your Order has been Placed
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "var(--txt-muted)",
            maxWidth: 520,
            margin: "0 auto 28px auto",
            lineHeight: 1.6,
          }}
        >
          Thank you for dining with <strong>CoU DineX</strong>. Your meal order has been received by{" "}
          <strong>{order.cafeteriaName}</strong> and kitchen preparation is getting started.
        </p>

        {/* Order Quick Telemetry Card */}
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "18px 20px",
            textAlign: "left",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: "var(--txt-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Order Number
            </span>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)", marginTop: 2 }}>
              #{order.orderNumber}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "var(--txt-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Bill
            </span>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--txt)", marginTop: 2 }}>
              ৳{order.totalAmount.toFixed(0)}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "var(--txt-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Payment Method
            </span>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--txt)", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>{order.paymentMethod}</span>
              {order.isDemo && (
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#FEF3C7", color: "#B45309", fontWeight: 800 }}>
                  Demo Payment
                </span>
              )}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "var(--txt-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Fulfillment Type
            </span>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--txt)", marginTop: 2 }}>
              {getDestinationLabel(order.deliveryType)}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 440,
            margin: "0 auto",
          }}
        >
          {/* Track Live Order */}
          <Link
            href={`/orders/${order.orderId}`}
            style={{
              padding: "14px 24px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 800,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 6px 20px rgba(15, 118, 110, 0.35)",
              transition: "transform 150ms ease",
            }}
          >
            <Clock size={18} />
            <span>Track Live Order Status</span>
            <ArrowRight size={18} />
          </Link>

          {/* Digital Receipt Slip */}
          <Link
            href={`/orders/${order.orderId}/receipt`}
            target="_blank"
            style={{
              padding: "12px 24px",
              borderRadius: 14,
              background: "var(--surface)",
              color: "var(--txt)",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "1.5px solid var(--border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <Receipt size={17} color="var(--primary)" />
            <span>View &amp; Print Digital Receipt</span>
          </Link>
        </div>
      </div>

      {/* "Craving Something Else?" Section */}
      <div
        style={{
          marginTop: 24,
          background: "linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)",
          border: "1px solid #99F6E4",
          borderRadius: 24,
          padding: "26px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 18,
        }}
      >
        <div style={{ maxWidth: 440 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>🍰 ☕</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F766E", margin: 0 }}>
              Craving Something Else?
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "#115E59", margin: 0, lineHeight: 1.5 }}>
            Need hot tea, brewed coffee, snacks, or cold drinks before class? Explore delicious campus selections in one click.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Explore Menu Button */}
          <Link
            href="/explore"
            onClick={onOrderMore}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              background: "#0F766E",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 3px 10px rgba(15, 118, 110, 0.25)",
            }}
          >
            <Utensils size={15} />
            <span>Browse Food Menu</span>
          </Link>

          {/* Go to Home Button */}
          <Link
            href="/"
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#0F766E",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(15, 118, 110, 0.3)",
            }}
          >
            <Home size={15} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
