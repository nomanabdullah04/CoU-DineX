"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { getItemImageUrl } from "@/lib/foodImages";
import {
  Utensils,
  ShoppingBag,
  Building,
  Building2,
  GraduationCap,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Truck,
  Coffee,
} from "lucide-react";

type DestinationType = "EAT_HERE" | "TAKE_AWAY" | "CAFETERIA_PICKUP" | "HALL_DELIVERY" | "DEPARTMENT_DELIVERY";

interface TableOption {
  id: string;
  tableNumber: string;
  capacity: number;
  isOccupied: boolean;
}

interface CafeteriaOption {
  id: string;
  name: string;
  slug: string;
  location: string;
  isOpen: boolean;
  tables: TableOption[];
}

interface HallOption {
  id: string;
  name: string;
  code: string;
  type: string | null;
}

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
  faculty: string | null;
  building: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    discountTotal,
    maxPrepTime,
    cafeteriaId,
    cafeteriaName,
    clearCart,
  } = useCart();

  // Destination state
  const [destinationType, setDestinationType] = useState<DestinationType>("EAT_HERE");
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [selectedHallId, setSelectedHallId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [roomNumber, setRoomNumber] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Backend options state
  const [cafeterias, setCafeterias] = useState<CafeteriaOption[]>([]);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  // Fetch destination options (tables, halls, departments)
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch("/api/checkout/options");
        if (res.ok) {
          const data = await res.json();
          setCafeterias(data.cafeterias || []);
          setHalls(data.halls || []);
          setDepartments(data.departments || []);

          // Pre-select first hall or department if available
          if (data.halls?.length > 0) setSelectedHallId(data.halls[0].id);
          if (data.departments?.length > 0) setSelectedDeptId(data.departments[0].id);
        }
      } catch (err) {
        console.error("Failed to load checkout options", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  // Compute delivery fee
  const deliveryFee =
    destinationType === "HALL_DELIVERY"
      ? 15
      : destinationType === "DEPARTMENT_DELIVERY"
      ? 10
      : 0;

  const totalAmount = subtotal + deliveryFee;

  // Find active cafeteria and tables
  const activeCafeteria =
    cafeterias.find((c) => c.id === cafeteriaId || c.slug === cafeteriaId) ||
    cafeterias[0];
  const availableTables = activeCafeteria?.tables || [];

  // Destination labels & descriptions
  const DESTINATION_TABS = [
    {
      id: "EAT_HERE" as DestinationType,
      label: "Eat Here",
      icon: Utensils,
      fee: "৳0",
      desc: "Dine inside cafeteria table",
    },
    {
      id: "TAKE_AWAY" as DestinationType,
      label: "Take Away",
      icon: ShoppingBag,
      fee: "৳0",
      desc: "Packed food for self takeaway",
    },
    {
      id: "CAFETERIA_PICKUP" as DestinationType,
      label: "Express Pickup",
      icon: Coffee,
      fee: "৳0",
      desc: "Counter express pickup",
    },
    {
      id: "HALL_DELIVERY" as DestinationType,
      label: "Hall Delivery",
      icon: Building,
      fee: "৳15",
      desc: "Residential hall room delivery",
    },
    {
      id: "DEPARTMENT_DELIVERY" as DestinationType,
      label: "Dept Delivery",
      icon: GraduationCap,
      fee: "৳10",
      desc: "Classroom / faculty drop",
    },
  ];

  // Submit Order Handler
  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    // Resolve effective cafeteria ID (prioritizing loaded database ID)
    const effectiveCafeteriaId = activeCafeteria?.id || cafeteriaId;

    if (!effectiveCafeteriaId) {
      setErrorMessage("Cafeteria information is missing. Please review your cart.");
      return;
    }

    if (destinationType === "EAT_HERE" && availableTables.length > 0 && !selectedTableId) {
      setErrorMessage("Please select a dining table number to eat inside.");
      return;
    }

    if (destinationType === "HALL_DELIVERY") {
      if (!selectedHallId) {
        setErrorMessage("Please choose your residential hall.");
        return;
      }
      if (!roomNumber.trim()) {
        setErrorMessage("Please enter your hall room or floor number.");
        return;
      }
    }

    if (destinationType === "DEPARTMENT_DELIVERY") {
      if (!selectedDeptId) {
        setErrorMessage("Please select your academic department / building.");
        return;
      }
      if (!roomNumber.trim()) {
        setErrorMessage("Please enter room, lab, or floor number.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        items: items.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
          specialInstructions: i.notes,
        })),
        destinationType,
        cafeteriaId: effectiveCafeteriaId,
        tableId: destinationType === "EAT_HERE" ? selectedTableId || undefined : undefined,
        hallId: destinationType === "HALL_DELIVERY" ? selectedHallId : undefined,
        departmentId: destinationType === "DEPARTMENT_DELIVERY" ? selectedDeptId : undefined,
        roomNumber: roomNumber.trim() || undefined,
        landmark: landmark.trim() || undefined,
        notes: orderNotes.trim() || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to place order. Please check item availability.");
        setSubmitting(false);
        return;
      }

      // Successful order creation
      clearCart();
      router.push(`/orders/${data.orderId}`);
    } catch (err) {
      console.error("Order creation failed", err);
      setErrorMessage("Network error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 60px 16px" }}>
      {/* Back button */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => router.push("/cart")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: "var(--txt-2)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Cart</span>
        </button>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--txt)", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
          Checkout &amp; Destination
        </h1>
        <p style={{ fontSize: 14, color: "var(--txt-muted)", margin: 0 }}>
          Choose where you want to eat or receive your food on Comilla University campus.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 14,
            padding: "14px 18px",
            color: "#B91C1C",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 28,
        }}
        className="lg:grid-cols-[1fr_380px]"
      >
        {/* Left Column: Destination Selection & Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 1. Destination Type Selector */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 22,
              padding: "24px 20px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: "0 0 4px 0" }}>
              1. Select Dining Destination
            </h2>
            <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "0 0 18px 0" }}>
              Select where you are enjoying your meal:
            </p>

            {/* Destination Mode Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              {DESTINATION_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = destinationType === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setDestinationType(tab.id)}
                    type="button"
                    style={{
                      borderRadius: 16,
                      padding: "14px 12px",
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: isSelected ? "var(--primary-light)" : "var(--surface-2)",
                      color: isSelected ? "var(--primary)" : "var(--txt)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: 6,
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                  >
                    <Icon size={24} />
                    <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
                      {tab.label}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 10,
                        background: isSelected ? "var(--primary)" : "var(--border)",
                        color: isSelected ? "#FFFFFF" : "var(--txt-muted)",
                      }}
                    >
                      {tab.fee === "৳0" ? "Free" : `+${tab.fee}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Destination Details Form */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 22,
              padding: "24px 20px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: "0 0 16px 0" }}>
              2. Destination Details
            </h2>

            {/* Mode: Eat Here */}
            {destinationType === "EAT_HERE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                    Cafeteria Dining Hall
                  </label>
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--txt)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Building2 size={16} className="text-emerald-600" />
                    <span>{cafeteriaName || activeCafeteria?.name || "Central Dining Hall"}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                    Select Table Number
                  </label>
                  {loadingOptions ? (
                    <div style={{ fontSize: 13, color: "var(--txt-muted)" }}>Loading tables…</div>
                  ) : availableTables.length > 0 ? (
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--txt)",
                        fontSize: 14,
                        outline: "none",
                      }}
                    >
                      <option value="">-- Choose a table --</option>
                      {availableTables.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.isOccupied}>
                          Table #{t.tableNumber} ({t.capacity} seats){t.isOccupied ? " — Occupied" : " — Available"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: 0 }}>
                      No registered tables found for this cafeteria. Order can still be placed for open seating.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mode: Take Away / Cafeteria Pickup */}
            {(destinationType === "TAKE_AWAY" || destinationType === "CAFETERIA_PICKUP") && (
              <div style={{ padding: "16px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <ShoppingBag size={20} color="var(--primary)" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)" }}>
                    Pickup Point: {cafeteriaName || activeCafeteria?.name || "Central Dining Hall"} Counter
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: 0 }}>
                  Your food will be freshly packed and waiting for you at the pickup counter. Show your Order ID when picking up.
                </p>
              </div>
            )}

            {/* Mode: Hall Delivery */}
            {destinationType === "HALL_DELIVERY" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                    Select Residential Hall <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    value={selectedHallId}
                    onChange={(e) => setSelectedHallId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--txt)",
                      fontSize: 14,
                      outline: "none",
                    }}
                  >
                    {halls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                      Room &amp; Floor <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room 402, 4th Floor"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--txt)",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                      Landmark / Gate (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. West Wing, near stairs"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--txt)",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mode: Department Delivery */}
            {destinationType === "DEPARTMENT_DELIVERY" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                    Select Department / Faculty Building <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--txt)",
                      fontSize: 14,
                      outline: "none",
                    }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) {d.building ? `— ${d.building}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                      Room / Lab / Floor <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lab 2, 3rd Floor"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--txt)",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                      Contact / Desk Info
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Front desk, call on arrival"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--txt)",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* General Order Notes Input */}
            <div style={{ marginTop: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                Special Cooking or Delivery Instructions (Optional)
              </label>
              <textarea
                placeholder="Any special notes for the cafeteria chef or delivery rider..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--txt)",
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Pre-Order Summary Card */}
        <div>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 22,
              padding: "24px 20px",
              boxShadow: "var(--shadow-card)",
              position: "sticky",
              top: 84,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: "0 0 16px 0" }}>
              Order Review
            </h2>

            {/* Item Previews List */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                maxHeight: 220,
                overflowY: "auto",
                marginBottom: 16,
                paddingRight: 4,
              }}
            >
              {items.map((item) => (
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
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        overflow: "hidden",
                        position: "relative",
                        background: "var(--surface-2)",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={item.imageUrl || getItemImageUrl(item.name)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </div>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: "var(--surface-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "var(--primary)",
                        flexShrink: 0,
                      }}
                    >
                      {item.quantity}x
                    </span>
                    <span style={{ color: "var(--txt)", fontWeight: 600, maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--txt)" }}>
                    ৳{(item.price * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Details */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-2)" }}>
                <span>Subtotal ({itemCount} items)</span>
                <span style={{ fontWeight: 700, color: "var(--txt)" }}>৳{subtotal.toFixed(0)}</span>
              </div>

              {discountTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={13} /> Discounts &amp; Offers
                  </span>
                  <span style={{ fontWeight: 700 }}>-৳{discountTotal.toFixed(0)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-2)" }}>
                <span>Delivery Fee ({destinationType.replace(/_/g, " ")})</span>
                <span style={{ fontWeight: 700, color: deliveryFee === 0 ? "#059669" : "var(--txt)" }}>
                  {deliveryFee === 0 ? "Free" : `৳${deliveryFee.toFixed(0)}`}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-2)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={13} /> Estimated Prep Time
                </span>
                <span style={{ fontWeight: 600, color: "var(--txt)" }}>~{maxPrepTime} mins</span>
              </div>

              {/* Total Row */}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 14,
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)" }}>Final Total</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)" }}>
                  ৳{totalAmount.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Payment Mode Note (No real payment yet) */}
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 12,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                fontSize: 12,
                color: "var(--txt-2)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} color="#059669" />
              <span>Payment Mode: <strong>Pay at Counter / Cash on Delivery</strong></span>
            </div>

            {/* Place Order Button */}
            <button
              id="place-order-submit-btn"
              onClick={handlePlaceOrder}
              disabled={submitting}
              style={{
                width: "100%",
                marginTop: 18,
                padding: "14px 20px",
                borderRadius: 14,
                background: submitting
                  ? "var(--txt-muted)"
                  : "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 4px 16px rgba(15, 118, 110, 0.35)",
                transition: "all 150ms ease",
              }}
            >
              <span>{submitting ? "Placing Order with Kitchen..." : "Confirm & Place Order"}</span>
              {!submitting && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
