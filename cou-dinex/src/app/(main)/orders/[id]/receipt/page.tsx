"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Phone,
  User,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Share2,
} from "lucide-react";
import { DigitalReceiptData } from "@/lib/payment/types";

export default function OrderReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [receipt, setReceipt] = useState<DigitalReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}/receipt`)
      .then((res) => {
        if (!res.ok) throw new Error("Receipt not found");
        return res.json();
      })
      .then((data) => {
        setReceipt(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load receipt");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!receipt) return;
    const printContents = receiptRef.current?.innerHTML;
    if (!printContents) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt-${receipt.orderNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
            .title { font-size: 24px; font-weight: 800; color: #0f766e; margin: 0; }
            .sub { font-size: 13px; color: #64748b; margin-top: 4px; }
            .demo-banner { background: #fef3c7; color: #b45309; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; text-align: center; margin: 12px 0; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th { text-align: left; border-bottom: 1px solid #cbd5e1; padding: 8px 4px; font-size: 12px; color: #64748b; }
            td { padding: 8px 4px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .totals { margin-top: 16px; border-top: 2px dashed #cbd5e1; padding-top: 12px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
            .grand-total { font-size: 18px; font-weight: 800; color: #0f766e; }
            .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CoU-DineX-Receipt-${receipt.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--txt-muted)", fontSize: 14 }}>Generating Digital Receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div style={{ maxWidth: 500, margin: "60px auto", padding: 24, textAlign: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--txt)", marginBottom: 8 }}>
          Receipt Unavailable
        </h2>
        <p style={{ color: "var(--txt-muted)", fontSize: 14, marginBottom: 20 }}>
          {error || "Could not retrieve digital receipt for this order."}
        </p>
        <Link
          href={`/orders/${orderId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 18px",
            borderRadius: 12,
            background: "var(--primary)",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} /> Back to Order
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(receipt.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedPaidDate = receipt.paidAt
    ? new Date(receipt.paidAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "24px 16px 64px 16px",
      }}
    >
      {/* Top Nav & Action Controls (Hidden when printed) */}
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Link
          href={`/orders/${orderId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--primary)",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} /> Back to Live Order Tracking
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            id="print-receipt-btn"
            onClick={handlePrint}
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
              boxShadow: "var(--shadow-card)",
            }}
          >
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>

          <button
            id="download-receipt-btn"
            onClick={handleDownload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 12,
              background: "var(--primary)",
              border: "none",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "var(--shadow-primary)",
            }}
          >
            <Download size={15} />
            <span>Download Slip</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Slip Card */}
      <div
        ref={receiptRef}
        className="receipt-card"
        style={{
          background: "#FFFFFF",
          color: "#0F172A",
          border: "1px solid #E2E8F0",
          borderRadius: 24,
          padding: "36px 32px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: "center", borderBottom: "2px dashed #E2E8F0", paddingBottom: 20, marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#0F766E",
              letterSpacing: "-0.5px",
              margin: "0 0 4px 0",
            }}
          >
            {receipt.appName}
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 2px 0", fontWeight: 600 }}>
            {receipt.campusName} Dining Services
          </p>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
            {receipt.cafeteriaName}
          </p>

          {/* Prominent Demo Notice if simulated */}
          {receipt.isDemo && (
            <div
              style={{
                marginTop: 14,
                padding: "6px 14px",
                background: "#FEF3C7",
                border: "1px dashed #F59E0B",
                borderRadius: 8,
                color: "#B45309",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertTriangle size={14} />
              <span>Demo Payment — Evaluation Slip</span>
            </div>
          )}
        </div>

        {/* Receipt Meta Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            fontSize: 13,
            paddingBottom: 18,
            borderBottom: "1px solid #F1F5F9",
            marginBottom: 20,
          }}
        >
          <div>
            <span style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
              Receipt Number
            </span>
            <span style={{ fontWeight: 800, color: "#0F172A", fontFamily: "monospace" }}>
              {receipt.receiptNumber}
            </span>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
              Order ID
            </span>
            <span style={{ fontWeight: 800, color: "#0F766E" }}>
              #{receipt.orderNumber}
            </span>
          </div>

          <div>
            <span style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
              Date & Time
            </span>
            <span style={{ fontWeight: 600, color: "#334155" }}>
              {formattedDate}
            </span>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
              Customer
            </span>
            <span style={{ fontWeight: 700, color: "#0F172A" }}>
              {receipt.customerName}
            </span>
            {receipt.customerPhone && (
              <span style={{ display: "block", fontSize: 11, color: "#64748B" }}>
                {receipt.customerPhone}
              </span>
            )}
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <span style={{ display: "block", color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
              Destination
            </span>
            <span style={{ fontWeight: 600, color: "#334155" }}>
              {receipt.destinationDisplay}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                <th style={{ textAlign: "left", padding: "8px 4px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Item
                </th>
                <th style={{ textAlign: "center", padding: "8px 4px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", width: 50 }}>
                  Qty
                </th>
                <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", width: 80 }}>
                  Price
                </th>
                <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", width: 80 }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 4px", fontSize: 13, color: "#1E293B", fontWeight: 600 }}>
                    <div>{item.name}</div>
                    {item.specialInstructions && (
                      <div style={{ fontSize: 11, color: "#0F766E", fontWeight: 400 }}>
                        Note: {item.specialInstructions}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "center", padding: "10px 4px", fontSize: 13, color: "#475569" }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 4px", fontSize: 13, color: "#475569" }}>
                    ৳{item.unitPrice.toFixed(0)}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 4px", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                    ৳{item.totalPrice.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown */}
        <div
          style={{
            borderTop: "2px dashed #E2E8F0",
            paddingTop: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#475569" }}>
            <span>Subtotal</span>
            <span>৳{receipt.subtotal.toFixed(0)}</span>
          </div>

          {receipt.discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#059669" }}>
              <span>Student Discount</span>
              <span>-৳{receipt.discount.toFixed(0)}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#475569" }}>
            <span>Delivery Fee</span>
            <span>{receipt.deliveryFee === 0 ? "Free" : `৳${receipt.deliveryFee.toFixed(0)}`}</span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderTop: "1px solid #E2E8F0",
              paddingTop: 10,
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
              Total Amount
            </span>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#0F766E" }}>
              ৳{receipt.totalAmount.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Payment Method
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
              {receipt.paymentMethod}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Payment Status
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 20,
                background:
                  receipt.paymentStatus === "PAID"
                    ? "#DCFCE7"
                    : receipt.paymentStatus === "PROCESSING"
                    ? "#EFF6FF"
                    : receipt.paymentStatus === "FAILED"
                    ? "#FEE2E2"
                    : "#FEF3C7",
                color:
                  receipt.paymentStatus === "PAID"
                    ? "#16A34A"
                    : receipt.paymentStatus === "PROCESSING"
                    ? "#2563EB"
                    : receipt.paymentStatus === "FAILED"
                    ? "#DC2626"
                    : "#B45309",
              }}
            >
              {receipt.paymentStatus}
            </span>
          </div>

          {receipt.transactionId && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: formattedPaidDate ? 8 : 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Transaction ID
              </span>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#334155", fontWeight: 700 }}>
                {receipt.transactionId}
              </span>
            </div>
          )}

          {formattedPaidDate && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Verified Paid At
              </span>
              <span style={{ fontSize: 12, color: "#334155" }}>
                {formattedPaidDate}
              </span>
            </div>
          )}
        </div>

        {/* Receipt Verification Barcode / Footer */}
        <div style={{ textAlign: "center", borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#64748B", margin: "0 0 4px 0" }}>
            Thank you for dining at Comilla University Cafeteria!
          </p>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
            Present this digital receipt or order #{receipt.orderNumber} at the counter if needed.
          </p>
        </div>
      </div>

      {/* Custom Print Style */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, header, nav, footer {
            display: none !important;
          }
          .receipt-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
