"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserPlus,
  Bike,
  ChefHat,
  Search,
  Plus,
  RefreshCw,
  X,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";

export function StaffSection() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    role: "CAFETERIA_STAFF",
    vehicleType: "Bicycle",
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/staff?role=${roleFilter}&search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setStaff(json.staff);
      }
    } catch (err) {
      console.error("Fetch staff error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create staff member");
      }
      setModalOpen(false);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        role: "CAFETERIA_STAFF",
        vehicleType: "Bicycle",
      });
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
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
            Staff & Operational Personnel
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Kitchen chefs, administrators, and campus delivery riders.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid var(--border, #CBD5E1)",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--surface, #FFFFFF)",
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="CAFETERIA_STAFF">Kitchen Staff / Chefs</option>
            <option value="DELIVERY_AGENT">Delivery Riders</option>
            <option value="CAFETERIA_ADMIN">Cafeteria Admin</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 12,
              background: "var(--primary, #FF6B00)",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(255, 107, 0, 0.2)",
            }}
          >
            <Plus size={15} /> Add Personnel
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>Loading staff...</div>
        ) : staff.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>No personnel found.</div>
        ) : (
          staff.map((s) => (
            <div
              key={s.id}
              style={{
                background: "var(--surface, #FFFFFF)",
                border: "1px solid var(--border, #E2E8F0)",
                borderRadius: 18,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: s.role === "DELIVERY_AGENT" ? "#FEF3C7" : "#0F766E15",
                      color: s.role === "DELIVERY_AGENT" ? "#D97706" : "#0F766E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {s.role === "DELIVERY_AGENT" ? <Bike size={20} /> : <ChefHat size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--txt, #0F172A)" }}>{s.fullName}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted, #64748B)" }}>{s.role}</div>
                  </div>
                </div>

                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: s.isActive ? "#10B981" : "#EF4444",
                  }}
                  title={s.isActive ? "Active Account" : "Inactive"}
                />
              </div>

              <div style={{ fontSize: 12, color: "var(--txt-muted, #64748B)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div>Phone: <strong>{s.maskedPhone}</strong></div>
                <div>Email: <strong>{s.maskedEmail}</strong></div>
                {s.deliveryAgent && (
                  <div style={{ marginTop: 4, background: "var(--surface-2, #F8FAFC)", padding: "6px 10px", borderRadius: 8 }}>
                    Mode: {s.deliveryAgent.vehicleType} • {s.deliveryAgent.completedDeliveries} Deliveries
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
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
              maxWidth: 440,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
                Add New Staff Member
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rafiqul Islam"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border, #CBD5E1)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Phone Number</label>
                <input
                  required
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border, #CBD5E1)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border, #CBD5E1)" }}
                >
                  <option value="CAFETERIA_STAFF">Cafeteria Kitchen Staff</option>
                  <option value="DELIVERY_AGENT">Delivery Rider</option>
                  <option value="CAFETERIA_ADMIN">Cafeteria Admin</option>
                </select>
              </div>

              {formData.role === "DELIVERY_AGENT" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border, #CBD5E1)" }}
                  >
                    <option value="Bicycle">Bicycle</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Walking">Walking / Campus Courier</option>
                  </select>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 18px", borderRadius: 10, background: "var(--primary, #FF6B00)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  {submitting ? "Adding..." : "Confirm & Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
