"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Store,
  Clock,
  MapPin,
  CheckCircle2,
  Save,
  RefreshCw,
  Building,
} from "lucide-react";

export function SettingsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.success) {
        setData(json.settings);
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateCafeteria = async (cafeteria: any) => {
    setSavingId(cafeteria.id);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeteriaId: cafeteria.id,
          isOpen: cafeteria.isOpen,
          openingTime: cafeteria.openingTime,
          closingTime: cafeteria.closingTime,
          location: cafeteria.location,
        }),
      });
      if (res.ok) {
        setSuccessMsg(`Updated settings for ${cafeteria.name}`);
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Save cafeteria error:", err);
    } finally {
      setSavingId(null);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>Loading settings...</div>;
  }

  const cafeterias = data?.cafeterias || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Platform Info Banner */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
            Platform System Settings & Operating Parameters
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Campus: <strong>{data?.campusName}</strong> • Platform: <strong>{data?.platformVersion}</strong> • Currency: <strong>{data?.currencySymbol} (BDT)</strong>
          </p>
        </div>

        {successMsg && (
          <span style={{ padding: "6px 12px", borderRadius: 8, background: "#ECFDF5", color: "#059669", fontSize: 12, fontWeight: 700 }}>
            ✓ {successMsg}
          </span>
        )}
      </div>

      {/* Cafeteria Management Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {cafeterias.map((c: any) => (
          <div
            key={c.id}
            style={{
              background: "var(--surface, #FFFFFF)",
              border: "1px solid var(--border, #E2E8F0)",
              borderRadius: 20,
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary-light, #FFF7ED)", color: "var(--primary, #FF6B00)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Store size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--txt, #0F172A)" }}>{c.name}</h3>
                  <span style={{ fontSize: 11, color: "var(--txt-muted)" }}>Location: {c.location}</span>
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.isOpen}
                  onChange={(e) => {
                    const updated = cafeterias.map((item: any) => item.id === c.id ? { ...item, isOpen: e.target.checked } : item);
                    setData({ ...data, cafeterias: updated });
                  }}
                />
                <span style={{ color: c.isOpen ? "#059669" : "#DC2626" }}>
                  {c.isOpen ? "OPEN NOW" : "CLOSED"}
                </span>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", display: "block", marginBottom: 4 }}>Opening Time</label>
                <input
                  type="text"
                  value={c.openingTime}
                  onChange={(e) => {
                    const updated = cafeterias.map((item: any) => item.id === c.id ? { ...item, openingTime: e.target.value } : item);
                    setData({ ...data, cafeterias: updated });
                  }}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", display: "block", marginBottom: 4 }}>Closing Time</label>
                <input
                  type="text"
                  value={c.closingTime}
                  onChange={(e) => {
                    const updated = cafeterias.map((item: any) => item.id === c.id ? { ...item, closingTime: e.target.value } : item);
                    setData({ ...data, cafeterias: updated });
                  }}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <span style={{ fontSize: 11, color: "var(--txt-muted)" }}>
                {c.stats?.menuItems || 0} Foods • {c.stats?.tables || 0} Tables
              </span>

              <button
                onClick={() => handleUpdateCafeteria(c)}
                disabled={savingId === c.id}
                style={{
                  padding: "7px 16px",
                  borderRadius: 10,
                  background: "#0F766E",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {savingId === c.id ? "Saving..." : "Save Status"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
