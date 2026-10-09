"use client";

import React, { useState, useEffect } from "react";
import {
  PackageOpen,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

export function InventorySection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(5);
  const [editSoldOut, setEditSoldOut] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory?filter=${filter}&search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.items);
      }
    } catch (err) {
      console.error("Fetch inventory error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const startEdit = (item: any) => {
    setEditingItem(item);
    setEditStock(item.currentStock);
    setEditThreshold(item.lowStockThreshold);
    setEditSoldOut(item.isSoldOut);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: editingItem.id,
          currentStock: editStock,
          lowStockThreshold: editThreshold,
          isSoldOut: editSoldOut,
        }),
      });
      if (res.ok) {
        setEditingItem(null);
        fetchInventory();
      }
    } catch (err) {
      console.error("Save inventory error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Controls */}
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
            Cafeteria Inventory & Stock Levels
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Daily portions, real-time depletion, low-stock threshold alerts, and instant sold-out triggers.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid var(--border, #CBD5E1)",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--surface, #FFFFFF)",
            }}
          >
            <option value="ALL">All Menu Inventory</option>
            <option value="LOW_STOCK">⚠️ Low Stock (≤ 5 units)</option>
            <option value="SOLD_OUT">🚫 Sold Out Items</option>
          </select>

          <button
            onClick={fetchInventory}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "var(--surface-2, #F8FAFC)",
              border: "1px solid var(--border, #CBD5E1)",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
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
                <th style={{ padding: "12px 16px" }}>Item Name</th>
                <th style={{ padding: "12px 16px" }}>Category</th>
                <th style={{ padding: "12px 16px" }}>Price</th>
                <th style={{ padding: "12px 16px" }}>Current Stock</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--txt-muted)" }}>
                    Loading stock...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--txt-muted)" }}>
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const isLow = it.currentStock <= it.lowStockThreshold && !it.isSoldOut && it.currentStock > 0;

                  return (
                    <tr key={it.id} style={{ borderBottom: "1px solid var(--border, #F1F5F9)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--txt, #0F172A)" }}>
                        {it.name}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--txt-muted)" }}>
                        {it.category}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        ৳{it.price}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{it.currentStock}</span> units
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {it.isSoldOut ? (
                          <span style={{ padding: "3px 8px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 800 }}>
                            SOLD OUT
                          </span>
                        ) : isLow ? (
                          <span style={{ padding: "3px 8px", borderRadius: 6, background: "#FEF3C7", color: "#D97706", fontSize: 11, fontWeight: 800 }}>
                            LOW STOCK (≤{it.lowStockThreshold})
                          </span>
                        ) : (
                          <span style={{ padding: "3px 8px", borderRadius: 6, background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 800 }}>
                            AVAILABLE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => startEdit(it)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "var(--surface-2, #F8FAFC)",
                            border: "1px solid var(--border, #CBD5E1)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Edit2 size={12} /> Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {editingItem && (
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
              maxWidth: 400,
              width: "100%",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Adjust: {editingItem.name}</h3>
              <button onClick={() => setEditingItem(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Current Stock Available (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Low Stock Threshold Alert
                </label>
                <input
                  type="number"
                  min="1"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(parseInt(e.target.value) || 5)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)" }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editSoldOut}
                  onChange={(e) => setEditSoldOut(e.target.checked)}
                />
                Mark Immediately as Sold Out
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setEditingItem(null)}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  style={{ padding: "8px 18px", borderRadius: 10, background: "var(--primary, #FF6B00)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
