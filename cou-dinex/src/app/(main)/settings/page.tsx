"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Moon,
  Sun,
  Shield,
  Smartphone,
  Lock,
  Utensils,
  ChevronRight,
  ArrowLeft,
  Check,
  Flame,
  Globe,
  HelpCircle,
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("light");
  const [orderPushAlerts, setOrderPushAlerts] = React.useState(true);
  const [orderSmsAlerts, setOrderSmsAlerts] = React.useState(true);
  const [soundEffects, setSoundEffects] = React.useState(true);
  const [dietPreference, setDietPreference] = React.useState<"all" | "halal" | "veg">("all");
  const [spiceLevel, setSpiceLevel] = React.useState<"mild" | "medium" | "spicy">("medium");
  const [saveToast, setSaveToast] = React.useState(false);

  function triggerSaveToast() {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link
          href="/profile"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#334155",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: 0 }}>
            App Settings & Preferences
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "2px 0 0" }}>
            Customize your CoU DineX dining and campus notification preferences
          </p>
        </div>
      </div>

      {saveToast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#0F766E",
          color: "#FFFFFF",
          padding: "12px 20px",
          borderRadius: 14,
          fontSize: 13,
          fontWeight: 700,
          boxShadow: "0 10px 25px rgba(15,118,110,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          zIndex: 999,
        }}>
          <Check size={16} strokeWidth={3} />
          Preferences saved successfully!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1. Dining & Food Preferences */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 20,
          padding: 22,
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#CCFBF1", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Utensils size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0F172A" }}>
                Dining & Taste Preferences
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Used by kitchen chefs when preparing your meals
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              Dietary Profile
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {(["all", "halal", "veg"] as const).map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => { setDietPreference(pref); triggerSaveToast(); }}
                  style={{
                    padding: "10px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    border: dietPreference === pref ? "2px solid #0F766E" : "1px solid #CBD5E1",
                    background: dietPreference === pref ? "#F0FDFA" : "#FFFFFF",
                    color: dietPreference === pref ? "#0F766E" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  {pref === "all" ? "Standard" : pref === "halal" ? "100% Halal" : "Vegetarian"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              Spice Tolerance
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {(["mild", "medium", "spicy"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => { setSpiceLevel(lvl); triggerSaveToast(); }}
                  style={{
                    padding: "10px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    border: spiceLevel === lvl ? "2px solid #F59E0B" : "1px solid #CBD5E1",
                    background: spiceLevel === lvl ? "#FEF3C7" : "#FFFFFF",
                    color: spiceLevel === lvl ? "#B45309" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  {lvl === "mild" ? "Mild (কম ঝাল)" : lvl === "medium" ? "Medium (স্বাভাবিক)" : "Spicy (বেশি ঝাল)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Notifications & Live Alerts */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 20,
          padding: 22,
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0F172A" }}>
                Order Tracking & Alerts
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Get notified when food is cooking, ready, or arriving
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>In-App Push Alerts</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Real-time updates as your food moves through kitchen</div>
              </div>
              <button
                type="button"
                onClick={() => { setOrderPushAlerts(!orderPushAlerts); triggerSaveToast(); }}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: orderPushAlerts ? "#0F766E" : "#CBD5E1",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 3,
                  left: orderPushAlerts ? 25 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>SMS Delivery Pin</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Receive delivery rider call & verification PIN via SMS</div>
              </div>
              <button
                type="button"
                onClick={() => { setOrderSmsAlerts(!orderSmsAlerts); triggerSaveToast(); }}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: orderSmsAlerts ? "#0F766E" : "#CBD5E1",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 3,
                  left: orderSmsAlerts ? 25 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Account & Security */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 20,
          padding: 22,
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EEF2FF", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0F172A" }}>
                Account & Security
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Manage password and session protection
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/forgot-password"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 12,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#1E293B",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Lock size={16} color="#64748B" />
                <span>Change Password</span>
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </Link>

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 12,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <LogOut size={16} />
                <span>Log Out of CoU DineX</span>
              </div>
              <ChevronRight size={16} color="#DC2626" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
