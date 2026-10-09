"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

export function PaymentsSection() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/payments?status=${statusFilter}&method=${methodFilter}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setPayments(json.payments);
        setTotalRevenue(json.totalPaidRevenue || 0);
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls & Revenue Banner */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
            Financial Transactions & Digital Payments
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Audit records for bKash, Nagad, Rocket, Cards, Campus Wallet, and Cash on Delivery.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted, #64748B)", textTransform: "uppercase" }}>
              Settled Revenue
            </span>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#059669" }}>
              ৳{totalRevenue.toLocaleString()}
            </div>
          </div>

          <button
            onClick={fetchPayments}
            style={{ padding: "8px 12px", borderRadius: 10, background: "var(--surface-2, #F8FAFC)", border: "1px solid var(--border, #CBD5E1)", cursor: "pointer" }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by transaction ID or order #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") fetchPayments(); }}
          style={{
            flex: 1,
            minWidth: 240,
            padding: "9px 12px",
            borderRadius: 12,
            border: "1px solid var(--border, #CBD5E1)",
            fontSize: 13,
            background: "var(--surface, #FFFFFF)",
          }}
        />

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid var(--border, #CBD5E1)", fontSize: 13, fontWeight: 600, background: "var(--surface, #FFFFFF)" }}
        >
          <option value="ALL">All Payment Methods</option>
          <option value="BKASH">bKash</option>
          <option value="NAGAD">Nagad</option>
          <option value="ROCKET">Rocket</option>
          <option value="CARD">Debit / Credit Card</option>
          <option value="WALLET">Campus Wallet</option>
          <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid var(--border, #CBD5E1)", fontSize: 13, fontWeight: 600, background: "var(--surface, #FFFFFF)" }}
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="REFUNDED">REFUNDED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {/* Payments Table */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--surface-2, #F8FAFC)", borderBottom: "1px solid var(--border, #E2E8F0)", color: "var(--txt-muted, #64748B)" }}>
                <th style={{ padding: "12px 16px" }}>Order #</th>
                <th style={{ padding: "12px 16px" }}>Customer</th>
                <th style={{ padding: "12px 16px" }}>Method</th>
                <th style={{ padding: "12px 16px" }}>Amount</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Transaction Ref</th>
                <th style={{ padding: "12px 16px" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--txt-muted)" }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--txt-muted)" }}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border, #F1F5F9)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800 }}>#{p.orderNumber}</td>
                    <td style={{ padding: "12px 16px" }}>{p.customerName}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--surface-2, #F8FAFC)", border: "1px solid var(--border, #CBD5E1)", fontSize: 11, fontWeight: 700 }}>
                        {p.method}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#059669" }}>৳{p.amount}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          background: p.status === "PAID" ? "#ECFDF5" : p.status === "REFUNDED" ? "#FEF3C7" : "#FEF2F2",
                          color: p.status === "PAID" ? "#059669" : p.status === "REFUNDED" ? "#D97706" : "#DC2626",
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "var(--txt-muted)" }}>
                      {p.transactionId || p.receiptNumber || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--txt-muted)", fontSize: 12 }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
