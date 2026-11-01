"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  CreditCard,
  Rocket,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { PaymentMethod } from "@/lib/payment/types";

interface DemoPaymentModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  onSuccess: (receiptUrl: string) => void;
  onCancel: () => void;
}

export function DemoPaymentModal({
  isOpen,
  orderId,
  orderNumber,
  amount,
  method,
  onSuccess,
  onCancel,
}: DemoPaymentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"DETAILS" | "OTP" | "PIN">("DETAILS");

  // Demo form states
  const [accountNumber, setAccountNumber] = useState("01712-345678");
  const [otp, setOtp] = useState("123456");
  const [pin, setPin] = useState("1234");
  const [cardNumber, setCardNumber] = useState("4532 8821 9012 3456");
  const [cardExpiry, setCardExpiry] = useState("09/28");
  const [cardCvv, setCardCvv] = useState("889");

  if (!isOpen) return null;

  const getMethodTheme = () => {
    switch (method) {
      case PaymentMethod.BKASH:
        return {
          name: "bKash Payment",
          color: "#E2136E",
          bg: "#FDF2F8",
          border: "#FBCFE8",
          icon: Smartphone,
          accountLabel: "bKash Mobile Account",
        };
      case PaymentMethod.NAGAD:
        return {
          name: "Nagad Payment",
          color: "#F7941D",
          bg: "#FFF7ED",
          border: "#FED7AA",
          icon: Zap,
          accountLabel: "Nagad Account Number",
        };
      case PaymentMethod.ROCKET:
        return {
          name: "Rocket Payment",
          color: "#8C3494",
          bg: "#FAF5FF",
          border: "#E9D5FF",
          icon: Rocket,
          accountLabel: "Rocket 12-Digit Account",
        };
      case PaymentMethod.CARD:
        return {
          name: "Debit / Credit Card",
          color: "#2563EB",
          bg: "#EFF6FF",
          border: "#BFDBFE",
          icon: CreditCard,
          accountLabel: "Card Details (Visa / Mastercard)",
        };
      default:
        return {
          name: "Payment Gateway",
          color: "#0F766E",
          bg: "#F0FDFA",
          border: "#CCFBF1",
          icon: Smartphone,
          accountLabel: "Account Number",
        };
    }
  };

  const theme = getMethodTheme();
  const IconComponent = theme.icon;

  const handleVerify = async (outcome: "SUCCESS" | "FAILED") => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          method,
          demoAccount: method === PaymentMethod.CARD ? cardNumber : accountNumber,
          demoPin: pin,
          simulatedOutcome: outcome,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(`/orders/${orderId}/receipt`);
      } else {
        setError(data.error || "Simulated payment failed.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error during simulated payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          maxWidth: 480,
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Secure Gateway Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
            color: "#FFFFFF",
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={16} />
            <span>CoU DineX Gateway</span>
          </div>
          <span style={{ fontSize: 11, opacity: 0.9 }}>Secure Payment</span>
        </div>

        {/* Modal Top Bar */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: theme.bg,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: theme.color,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 12px ${theme.color}40`,
              }}
            >
              <IconComponent size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                {theme.name}
              </h3>
              <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: 0 }}>
                Order #{orderNumber}
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, color: "var(--txt-muted)", display: "block" }}>
              Amount Due
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: theme.color }}>
              ৳{amount.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: "24px" }}>
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 14,
                padding: "12px 16px",
                color: "#991B1B",
                fontSize: 13,
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <XCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: 14,
              padding: "12px 16px",
              border: "1px dashed var(--border)",
              marginBottom: 18,
              fontSize: 12,
              color: "var(--txt-2)",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "var(--txt)" }}>Notice:</strong> You are testing the CoU DineX
            payment flow. Pre-filled simulated credentials below demonstrate a complete digital transaction.
          </div>

          {method === PaymentMethod.CARD ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                  Card Number (Simulated)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--txt)",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  />
                  <CreditCard size={18} style={{ position: "absolute", right: 12, top: 12, color: "var(--txt-muted)" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--txt)",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                    CVV
                  </label>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--txt)",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                  {theme.accountLabel}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--txt)",
                    fontSize: 14,
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                    Demo OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--txt)",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
                    Demo PIN
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--txt)",
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <button
              id="confirm-demo-payment-btn"
              onClick={() => handleVerify("SUCCESS")}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                background: loading ? "var(--txt-muted)" : theme.color,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 800,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: `0 4px 14px ${theme.color}40`,
                transition: "all 150ms ease",
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Complete Payment (৳{amount.toFixed(0)})</span>
                </>
              )}
            </button>

            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--txt-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div
          style={{
            padding: "12px 24px",
            background: "var(--surface-2)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--txt-muted)",
          }}
        >
          <Lock size={12} />
          <span>256-Bit SSL Encrypted • Comilla University Payment Gateway</span>
        </div>
      </div>
    </div>
  );
}
