"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { getItemImageUrl } from "@/lib/foodImages";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  Utensils,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    discountTotal,
    maxPrepTime,
    cafeteriaName,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    updateItemNotes,
    clearCart,
  } = useCart();

  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", textAlign: "center" }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "60px 24px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
            }}
          >
            <ShoppingBag size={38} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--txt)", margin: "0 0 8px 0" }}>
            Your Cart is Empty
          </h2>
          <p style={{ fontSize: 14, color: "var(--txt-muted)", maxWidth: 420, margin: "0 auto 24px auto" }}>
            Looks like you haven&apos;t added any delicious campus food yet. Explore the menu to order lunch, snacks, or coffee!
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/explore"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 14,
                background: "var(--primary)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "var(--shadow-primary)",
              }}
            >
              <Utensils size={18} />
              <span>Explore Campus Menu</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                borderRadius: 14,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--txt)",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              <Clock size={16} />
              <span>Track Active Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 60px 16px" }}>
      {/* Top Breadcrumb / Back */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          onClick={() => router.back()}
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
          <span>Continue Ordering</span>
        </button>

        <button
          onClick={() => {
            if (confirm("Are you sure you want to clear your entire cart?")) {
              clearCart();
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            color: "#DC2626",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Trash2 size={15} />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Title & Cafeteria Tag */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--txt)", margin: 0, letterSpacing: "-0.02em" }}>
            Shopping Cart
          </h1>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              background: "var(--primary-light)",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {itemCount} {itemCount === 1 ? "Item" : "Items"}
          </span>
        </div>
        {cafeteriaName && (
          <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "4px 0 0 0" }}>
            Ordering live from: <strong style={{ color: "var(--txt)" }}>{cafeteriaName}</strong>
          </p>
        )}
      </div>

      {/* Grid Layout: Cart items on left, Summary on right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
        }}
        className="lg:grid-cols-[1fr_360px]"
      >
        {/* Left: Cart Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item) => {
            const hasDiscount = item.originalPrice > item.price;
            const lineTotal = item.price * item.quantity;
            const isEditingNote = activeNoteItemId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "16px 18px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "var(--surface-2)",
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={item.imageUrl || getItemImageUrl(item.name)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 8 }}>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--txt)",
                          margin: "0 0 4px 0",
                          lineHeight: 1.2,
                        }}
                      >
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--txt-muted)",
                          cursor: "pointer",
                          padding: 4,
                        }}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--txt-muted)", marginBottom: 8 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Clock size={12} /> ~{item.preparationTimeMinutes} mins
                      </span>
                      <span>•</span>
                      <span>Unit: ৳{item.price.toFixed(0)}</span>
                      {hasDiscount && (
                        <span style={{ textDecoration: "line-through", color: "var(--txt-muted)", opacity: 0.7 }}>
                          ৳{item.originalPrice.toFixed(0)}
                        </span>
                      )}
                    </div>

                    {/* Quantity Selector & Line Total */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 12,
                          background: "var(--surface-2)",
                          borderRadius: 12,
                          padding: "4px 8px",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            border: "none",
                            background: "var(--surface)",
                            color: "var(--txt)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--txt)", minWidth: 16, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            border: "none",
                            background: "var(--surface)",
                            color: "var(--txt)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>
                          ৳{lineTotal.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Instruction Note toggle */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                  {!isEditingNote && !item.notes ? (
                    <button
                      onClick={() => setActiveNoteItemId(item.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: 0,
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>Add cooking note / special instruction</span>
                    </button>
                  ) : isEditingNote ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="e.g. extra spicy, no onion, separate gravy..."
                        value={item.notes || ""}
                        onChange={(e) => updateItemNotes(item.id, e.target.value)}
                        style={{
                          flex: 1,
                          fontSize: 12,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "var(--surface-2)",
                          color: "var(--txt)",
                          outline: "none",
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => setActiveNoteItemId(null)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "var(--primary)",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--txt-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        <MessageSquare size={13} color="var(--primary)" /> Note: <em>{item.notes}</em>
                      </span>
                      <button
                        onClick={() => setActiveNoteItemId(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Order Summary Card */}
        <div>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "24px 20px",
              boxShadow: "var(--shadow-card)",
              position: "sticky",
              top: 84,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: "0 0 16px 0" }}>
              Order Summary
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-2)" }}>
                <span>Subtotal ({itemCount} items)</span>
                <span style={{ fontWeight: 700, color: "var(--txt)" }}>৳{subtotal.toFixed(0)}</span>
              </div>

              {discountTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={14} /> Total Discount
                  </span>
                  <span style={{ fontWeight: 700 }}>-৳{discountTotal.toFixed(0)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-2)" }}>
                <span>Est. Preparation Time</span>
                <span style={{ fontWeight: 600, color: "var(--txt)" }}>~{maxPrepTime} mins</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt-muted)", fontSize: 12 }}>
                <span>Delivery Fee</span>
                <span>Calculated at checkout</span>
              </div>

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
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)" }}>Estimated Total</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)" }}>
                  ৳{subtotal.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <Link
              href="/checkout"
              id="proceed-to-checkout-btn"
              style={{
                width: "100%",
                marginTop: 20,
                padding: "14px 20px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(15, 118, 110, 0.3)",
                transition: "all 150ms ease",
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </Link>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 14,
                fontSize: 11,
                color: "var(--txt-muted)",
                justifyContent: "center",
              }}
            >
              <AlertCircle size={13} />
              <span>Real-time kitchen availability will be confirmed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
