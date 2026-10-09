"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Eye,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";

export function OrdersSection() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/orders?page=${page}&status=${statusFilter}&deliveryType=${deliveryTypeFilter}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, deliveryTypeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Filter Bar */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Campus Order Management
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
              Real-time monitoring across cafeteria counters, table QR diners, hall deliveries, and department couriers.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => window.open("/api/admin/export?type=orders&format=csv", "_blank")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: "#0F766E",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              onClick={fetchOrders}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "var(--surface-2, #F8FAFC)",
                border: "1px solid var(--border, #CBD5E1)",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 240, display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--txt-muted)" }} />
              <input
                type="text"
                placeholder="Search by order # or customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  borderRadius: 12,
                  border: "1px solid var(--border, #CBD5E1)",
                  fontSize: 13,
                  outline: "none",
                  background: "var(--surface-2, #F8FAFC)",
                }}
              />
            </div>
            <button
              type="submit"
              style={{ padding: "9px 16px", borderRadius: 12, background: "var(--primary, #FF6B00)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
            >
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid var(--border, #CBD5E1)", fontSize: 13, fontWeight: 600, background: "var(--surface, #FFFFFF)" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY_FOR_PICKUP">Ready For Pickup</option>
            <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={deliveryTypeFilter}
            onChange={(e) => { setDeliveryTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid var(--border, #CBD5E1)", fontSize: 13, fontWeight: 600, background: "var(--surface, #FFFFFF)" }}
          >
            <option value="ALL">All Delivery Types</option>
            <option value="CAFETERIA_PICKUP">Cafeteria Pickup</option>
            <option value="HALL_DELIVERY">Hall Delivery</option>
            <option value="DEPARTMENT_DELIVERY">Department Delivery</option>
            <option value="TABLE_QR">Table QR</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
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
                <th style={{ padding: "12px 16px" }}>Type</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Items</th>
                <th style={{ padding: "12px 16px" }}>Total</th>
                <th style={{ padding: "12px 16px" }}>Time</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--txt-muted)" }}>
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--txt-muted)" }}>
                    No orders matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border, #F1F5F9)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "var(--txt, #0F172A)" }}>
                      #{o.orderNumber}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{o.user.fullName}</div>
                      <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>{o.user.maskedPhone}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0F766E", background: "#F0FDFA", padding: "3px 8px", borderRadius: 6 }}>
                        {o.deliveryType.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          background:
                            o.status === "DELIVERED"
                              ? "#ECFDF5"
                              : o.status === "CANCELLED"
                              ? "#FEF2F2"
                              : o.status === "PREPARING" || o.status === "OUT_FOR_DELIVERY"
                              ? "#EFF6FF"
                              : "#FEF3C7",
                          color:
                            o.status === "DELIVERED"
                              ? "#059669"
                              : o.status === "CANCELLED"
                              ? "#DC2626"
                              : o.status === "PREPARING" || o.status === "OUT_FOR_DELIVERY"
                              ? "#2563EB"
                              : "#D97706",
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{o.itemCount} items</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800 }}>৳{o.totalAmount}</td>
                    <td style={{ padding: "12px 16px", color: "var(--txt-muted)", fontSize: 12 }}>
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedOrder(o)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          background: "var(--surface-2, #F8FAFC)",
                          border: "1px solid var(--border, #CBD5E1)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--border, #E2E8F0)" }}>
            <span style={{ fontSize: 12, color: "var(--txt-muted)" }}>
              Page {page} of {pagination.totalPages} ({pagination.total} orders)
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border, #CBD5E1)", background: "transparent", cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border, #CBD5E1)", background: "transparent", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface, #FFFFFF)",
              borderRadius: 20,
              maxWidth: 480,
              width: "100%",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                Order #{selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <div>Customer: <strong>{selectedOrder.user.fullName}</strong> ({selectedOrder.user.maskedPhone})</div>
              <div>Status: <strong>{selectedOrder.status}</strong></div>
              <div>Type: <strong>{selectedOrder.deliveryType}</strong></div>
              {selectedOrder.deliveryAgent && <div>Assigned Rider: <strong>{selectedOrder.deliveryAgent}</strong></div>}

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
                <strong>Ordered Items:</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {selectedOrder.items?.map((it: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{it.quantity}x {it.name}</span>
                      <span>৳{it.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15 }}>
                <span>Total Amount:</span>
                <span style={{ color: "var(--primary, #FF6B00)" }}>৳{selectedOrder.totalAmount}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ padding: "8px 18px", borderRadius: 10, background: "var(--surface-2, #F8FAFC)", border: "1px solid var(--border, #CBD5E1)", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
