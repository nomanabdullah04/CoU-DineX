"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useKitchenOrders,
  KitchenOrder,
} from "@/hooks/useKitchenOrders";
import {
  ChefHat,
  Clock,
  Volume2,
  VolumeX,
  RefreshCw,
  Maximize,
  Minimize,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Flame,
  Check,
  Building2,
  Home,
  Utensils,
  ShoppingBag,
  BellRing,
  Timer,
  Sun,
  Moon,
  ArrowLeft,
  Sparkles,
  Inbox,
  CheckCheck,
  Search,
  PlusCircle,
  Filter,
  Shield,
  Layers,
  Sparkle,
} from "lucide-react";

export default function KitchenDisplayPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [dismissedCompletedIds, setDismissedCompletedIds] = useState<string[]>([]);
  const [orderTypeFilter, setOrderTypeFilter] = useState<"ALL" | "TABLE_QR" | "HALL_DELIVERY" | "CAFETERIA_PICKUP">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoggingInChef, setIsLoggingInChef] = useState(false);

  // Checked items state
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<string, boolean>>>({});

  const {
    data,
    isLoading,
    isRefreshing,
    error,
    actionInProgress,
    refresh,
    acceptOrder,
    startPreparing,
    markReady,
    completeOrder,
  } = useKitchenOrders({
    pollIntervalMs: 3500,
    autoRefresh: true,
    soundEnabled,
  });

  // Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Friendly Chime
  const testChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(660, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {}
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 1-Click Chef Switch
  const handleQuickChefLogin = async () => {
    setIsLoggingInChef(true);
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "kitchen" }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        window.location.href = "/login?callbackUrl=/kitchen";
      }
    } catch {
      window.location.href = "/login?callbackUrl=/kitchen";
    } finally {
      setIsLoggingInChef(false);
    }
  };

  // Simulate incoming test order
  const handleSimulateOrder = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/kitchen/orders", { method: "POST" });
      if (res.ok) {
        testChime();
        await refresh();
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // Item strike-through toggle
  const toggleItemCheck = (orderId: string, itemId: string) => {
    setCheckedItems((prev) => {
      const orderChecks = prev[orderId] || {};
      return {
        ...prev,
        [orderId]: {
          ...orderChecks,
          [itemId]: !orderChecks[itemId],
        },
      };
    });
  };

  const isDark = theme === "dark";

  // Filter orders by deliveryType and search query
  const filterOrders = (list: KitchenOrder[] = []) => {
    return list.filter((order) => {
      if (orderTypeFilter !== "ALL" && order.destination.type !== orderTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(query);
        const matchesCustomer = order.customer.name.toLowerCase().includes(query);
        const matchesItem = order.items.some((i) => i.name.toLowerCase().includes(query));
        return matchesNumber || matchesCustomer || matchesItem;
      }
      return true;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "#0A0F1D" : "#F8FAFC",
        color: isDark ? "#FFFFFF" : "#0F172A",
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 24,
          background: "linear-gradient(135deg, #0F766E, #F59E0B)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 28px rgba(15,118,110,0.35)",
          marginBottom: 18,
          animation: "bounce 1.5s infinite",
        }}>
          <ChefHat size={32} color="#FFFFFF" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.3px", margin: 0 }}>
          Connecting to Kitchen OS Terminal...
        </h2>
        <p style={{ fontSize: 13, color: isDark ? "#94A3B8" : "#64748B", marginTop: 6, fontWeight: 500 }}>
          Synchronizing live kitchen tickets with central cafeteria Wok & Grill station
        </p>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    );
  }

  // Unauthorized Portal
  if (error && !data) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "#0A0F1D" : "#F8FAFC",
        padding: 20,
      }}>
        <div style={{
          maxWidth: 440,
          width: "100%",
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E2E8F0",
          borderRadius: 28,
          padding: "36px 28px",
          textAlign: "center",
          boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            background: "linear-gradient(135deg, #0F766E, #F59E0B)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(15,118,110,0.3)",
          }}>
            <ChefHat size={32} color="#FFFFFF" />
          </div>

          <span style={{
            background: isDark ? "rgba(15,118,110,0.2)" : "#CCFBF1",
            color: "#0F766E",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "4px 10px",
            borderRadius: 8,
          }}>
            Kitchen Display System (KDS)
          </span>

          <h2 style={{ fontSize: 22, fontWeight: 900, color: isDark ? "#FFFFFF" : "#0F172A", margin: "14px 0 8px" }}>
            Cafeteria Kitchen Terminal
          </h2>

          <p style={{ fontSize: 13, color: isDark ? "#94A3B8" : "#64748B", margin: "0 0 24px", lineHeight: 1.5 }}>
            CoU DineX real-time kitchen ticket management for chefs, line cooks, and cafeteria fulfillment.
          </p>

          <Link
            href="/login?callbackUrl=/kitchen"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #0F766E, #047857)",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 6px 18px rgba(15,118,110,0.3)",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          >
            <ChefHat size={18} />
            Sign In with Kitchen Staff Credentials
          </Link>

          <Link
            href="/home"
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              borderRadius: 14,
              background: isDark ? "#1F2937" : "#F1F5F9",
              color: isDark ? "#E5E7EB" : "#334155",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Return to Customer Home
          </Link>
        </div>
      </div>
    );
  }

  const counts = data?.counts || { totalActive: 0, new: 0, confirmed: 0, preparing: 0, ready: 0, completed: 0 };
  const rawOrders = data?.orders || { newOrders: [], confirmed: [], preparing: [], ready: [], completed: [] };

  const orders = {
    newOrders: filterOrders(rawOrders.newOrders),
    confirmed: filterOrders(rawOrders.confirmed),
    preparing: filterOrders(rawOrders.preparing),
    ready: filterOrders(rawOrders.ready),
    completed: filterOrders(rawOrders.completed),
  };

  const isKitchenStaff =
    data?.staff?.role === "CAFETERIA_STAFF" ||
    data?.staff?.role === "CAFETERIA_ADMIN" ||
    data?.staff?.role === "SUPER_ADMIN";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: isDark ? "#080E1A" : "#F1F5F9",
      color: isDark ? "#F8FAFC" : "#0F172A",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Student Read-Only Notice */}
      {!isKitchenStaff && (
        <div style={{
          background: isDark ? "rgba(15,118,110,0.25)" : "#CCFBF1",
          borderBottom: isDark ? "1px solid rgba(15,118,110,0.4)" : "1px solid #99F6E4",
          padding: "10px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 12,
          fontWeight: 700,
          color: isDark ? "#A7F3D0" : "#0F766E",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ChefHat size={18} />
            <span>
              <strong>Student Live Kitchen Radar (Read-Only Mode)</strong>: You are viewing live cafeteria preparation queues and wait times. Order status updates are controlled strictly by certified cafeteria kitchen staff.
            </span>
          </div>
          <Link
            href="/home"
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              background: "#0F766E",
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Back to Food Menu →
          </Link>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          1. TOP COMMAND BAR (HUD / TELEMETRY / TOOLS)
         ══════════════════════════════════════════════════════════════ */}
      <header style={{
        background: isDark ? "rgba(12, 19, 36, 0.95)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
        padding: "10px 20px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          {/* Left: Branding & Quick Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/home"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  background: isDark ? "#1E293B" : "#F1F5F9",
                  color: isDark ? "#CBD5E1" : "#475569",
                  border: isDark ? "1px solid #334155" : "1px solid #CBD5E1",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={13} />
                <span>Home</span>
              </Link>

              {isKitchenStaff && (
                <Link
                  href="/admin"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    background: isDark ? "#1E293B" : "#F1F5F9",
                    color: isDark ? "#CBD5E1" : "#475569",
                    border: isDark ? "1px solid #334155" : "1px solid #CBD5E1",
                    textDecoration: "none",
                  }}
                >
                  <Shield size={13} />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            <div style={{ width: 1, height: 24, background: isDark ? "#1E293B" : "#E2E8F0" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "linear-gradient(135deg, #0F766E, #F59E0B)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(15,118,110,0.3)",
              }}>
                <ChefHat size={20} />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.3px", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                    CoU Kitchen OS
                  </span>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    color: "#10B981",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 6,
                    letterSpacing: "0.5px",
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s infinite" }} />
                    {isKitchenStaff ? "LIVE STATION" : "LIVE RADAR"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", fontWeight: 500 }}>
                  Central Cafeteria • Station: <strong style={{ color: "#F59E0B" }}>{data?.staff?.name || "Kitchen Chef"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Center: High Visibility Telemetry & Digital Clock Island */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: isDark ? "#0F172A" : "#FFFFFF",
            border: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0",
            padding: "6px 16px",
            borderRadius: 16,
            boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.05)",
          }}>
            {/* Avg Prep Time */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: isDark ? "rgba(15,118,110,0.25)" : "#CCFBF1",
                color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Timer size={15} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: isDark ? "#94A3B8" : "#64748B", textTransform: "uppercase" }}>
                  Avg Cook
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: isDark ? "#FFFFFF" : "#0F172A" }}>
                  {data?.telemetry?.avgWaitMinutes || 10} min
                </div>
              </div>
            </div>

            <div style={{ width: 1, height: 22, background: isDark ? "#334155" : "#E2E8F0" }} />

            {/* Active Queue */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: isDark ? "rgba(245,158,11,0.2)" : "#FEF3C7",
                color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Flame size={15} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: isDark ? "#94A3B8" : "#64748B", textTransform: "uppercase" }}>
                  Queue Load
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#F59E0B" }}>
                  {counts.totalActive} Active
                </div>
              </div>
            </div>

            <div style={{ width: 1, height: 22, background: isDark ? "#334155" : "#E2E8F0" }} />

            {/* Glowing Amber HUD Clock */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: isDark ? "rgba(245,158,11,0.2)" : "#FEF3C7",
                color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Clock size={15} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: isDark ? "#94A3B8" : "#64748B", textTransform: "uppercase" }}>
                  Station Clock
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 900,
                  fontFamily: "monospace",
                  color: "#F59E0B",
                  letterSpacing: "1px",
                  textShadow: isDark ? "0 0 10px rgba(245, 158, 11, 0.4)" : "none",
                }}>
                  {currentTime}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Audio, Fullscreen, Theme & Exit */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) testChime();
              }}
              style={{
                height: 36,
                padding: "0 10px",
                borderRadius: 10,
                border: soundEnabled
                  ? "1.5px solid #0F766E"
                  : isDark ? "1px solid #334155" : "1px solid #CBD5E1",
                background: soundEnabled
                  ? isDark ? "rgba(15,118,110,0.25)" : "#CCFBF1"
                  : isDark ? "#1E293B" : "#F8FAFC",
                color: soundEnabled ? "#0F766E" : isDark ? "#94A3B8" : "#64748B",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
              title={soundEnabled ? "Audio chime active (Click to mute)" : "Audio muted (Click to enable)"}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="hidden sm:inline">{soundEnabled ? "Sound On" : "Muted"}</span>
            </button>

            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: isDark ? "1px solid #334155" : "1px solid #CBD5E1",
                background: isDark ? "#1E293B" : "#F8FAFC",
                color: isDark ? "#F59E0B" : "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => refresh()}
              disabled={isRefreshing}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: isDark ? "1px solid #334155" : "1px solid #CBD5E1",
                background: isDark ? "#1E293B" : "#F8FAFC",
                color: isDark ? "#E2E8F0" : "#334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Refresh queue"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin text-teal-500" : ""} />
            </button>

            <button
              onClick={toggleFullscreen}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: isDark ? "1px solid #334155" : "1px solid #CBD5E1",
                background: isDark ? "#1E293B" : "#F8FAFC",
                color: isDark ? "#E2E8F0" : "#334155",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              className="sm:flex"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>

            <button
              onClick={handleLogout}
              style={{
                height: 36,
                padding: "0 10px",
                borderRadius: 10,
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#EF4444",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
              title="Logout Session"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          2. FILTER TABS & REAL-TIME TEST SIMULATOR
         ══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: isDark ? "#0D1527" : "#E2E8F0",
        borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid #CBD5E1",
        padding: "8px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}>
        {/* Category Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#94A3B8" : "#64748B", textTransform: "uppercase", marginRight: 4 }}>
            Filter:
          </span>

          {[
            { id: "ALL", label: "All Tickets", count: counts.totalActive },
            { id: "TABLE_QR", label: "🍽️ Dine-In (Table)", count: undefined },
            { id: "HALL_DELIVERY", label: "🏢 Hall Delivery", count: undefined },
            { id: "CAFETERIA_PICKUP", label: "🛍️ Counter Pickup", count: undefined },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOrderTypeFilter(tab.id as any)}
              style={{
                padding: "6px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                border: orderTypeFilter === tab.id
                  ? "1.5px solid #0F766E"
                  : isDark ? "1px solid #1E293B" : "1px solid #CBD5E1",
                background: orderTypeFilter === tab.id
                  ? "#0F766E"
                  : isDark ? "#131C31" : "#FFFFFF",
                color: orderTypeFilter === tab.id
                  ? "#FFFFFF"
                  : isDark ? "#CBD5E1" : "#334155",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  marginLeft: 6,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.25)",
                  fontSize: 10,
                  fontWeight: 900,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Staff Simulate button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: isDark ? "#64748B" : "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search token #, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: 190,
                padding: "6px 12px 6px 30px",
                borderRadius: 10,
                fontSize: 12,
                border: isDark ? "1px solid #334155" : "1px solid #CBD5E1",
                background: isDark ? "#131C31" : "#FFFFFF",
                color: isDark ? "#FFFFFF" : "#0F172A",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. PURE 5-COLUMN KANBAN BOARD (HIGH-CONTRAST RESTAURANT KDS)
         ══════════════════════════════════════════════════════════════ */}
      <main style={{ flex: 1, padding: 14, overflowX: "auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(280px, 1fr))",
          gap: 14,
          minWidth: 1400,
        }}>
          {/* Column 1: New Orders */}
          <OrderColumn
            title="New Orders"
            count={orders.newOrders.length}
            themeVariant="amber"
            icon={Inbox}
            isDark={isDark}
            orders={orders.newOrders}
            emptyMessage="No pending tickets"
            emptySub="Incoming orders will chime here"
            actionInProgress={actionInProgress}
            checkedItems={checkedItems}
            toggleItemCheck={isKitchenStaff ? toggleItemCheck : () => {}}
            renderAction={(order) => isKitchenStaff ? (
              <button
                onClick={() => acceptOrder(order.id)}
                disabled={actionInProgress[order.id]}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#0F766E",
                  fontSize: 13,
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                }}
              >
                <Check size={16} strokeWidth={3} />
                Accept Ticket
              </button>
            ) : (
              <div style={{
                width: "100%",
                padding: "8px",
                borderRadius: 10,
                textAlign: "center",
                fontSize: 12,
                fontWeight: 800,
                background: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#F59E0B",
              }}>
                ⏳ Awaiting Kitchen Chef
              </div>
            )}
          />

          {/* Column 2: Confirmed Queue */}
          <OrderColumn
            title="Confirmed Queue"
            count={orders.confirmed.length}
            themeVariant="sky"
            icon={CheckCircle2}
            isDark={isDark}
            orders={orders.confirmed}
            emptyMessage="Queue is clear"
            emptySub="Accepted tickets waiting for chef"
            actionInProgress={actionInProgress}
            checkedItems={checkedItems}
            toggleItemCheck={isKitchenStaff ? toggleItemCheck : () => {}}
            renderAction={(order) => isKitchenStaff ? (
              <button
                onClick={() => startPreparing(order.id)}
                disabled={actionInProgress[order.id]}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #0EA5E9, #2563EB)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
                }}
              >
                <Flame size={16} />
                Start Cooking
              </button>
            ) : (
              <div style={{
                width: "100%",
                padding: "8px",
                borderRadius: 10,
                textAlign: "center",
                fontSize: 12,
                fontWeight: 800,
                background: isDark ? "rgba(14,165,233,0.12)" : "#E0F2FE",
                border: "1px solid rgba(14,165,233,0.3)",
                color: "#0EA5E9",
              }}>
                👨‍🍳 Queued for Stove Prep
              </div>
            )}
          />

          {/* Column 3: Cooking on Stove */}
          <OrderColumn
            title="Cooking on Stove"
            count={orders.preparing.length}
            themeVariant="orange"
            icon={Flame}
            isDark={isDark}
            orders={orders.preparing}
            emptyMessage="Pans are clear"
            emptySub="No dishes currently cooking"
            actionInProgress={actionInProgress}
            checkedItems={checkedItems}
            toggleItemCheck={isKitchenStaff ? toggleItemCheck : () => {}}
            renderAction={(order) => isKitchenStaff ? (
              <button
                onClick={() => markReady(order.id)}
                disabled={actionInProgress[order.id]}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #F97316, #EA580C)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
                }}
              >
                <BellRing size={16} />
                Mark Ready for Pickup
              </button>
            ) : (
              <div style={{
                width: "100%",
                padding: "8px",
                borderRadius: 10,
                textAlign: "center",
                fontSize: 12,
                fontWeight: 800,
                background: isDark ? "rgba(249,115,22,0.12)" : "#FFEDD5",
                border: "1px solid rgba(249,115,22,0.3)",
                color: "#F97316",
              }}>
                🔥 Currently Sizzling on Stove
              </div>
            )}
          />

          {/* Column 4: Ready at Counter */}
          <OrderColumn
            title="Ready at Counter"
            count={orders.ready.length}
            themeVariant="emerald"
            icon={BellRing}
            isDark={isDark}
            orders={orders.ready}
            emptyMessage="Counter is clear"
            emptySub="Packaged meals waiting for handover"
            actionInProgress={actionInProgress}
            checkedItems={checkedItems}
            toggleItemCheck={isKitchenStaff ? toggleItemCheck : () => {}}
            renderAction={(order) => isKitchenStaff ? (
              <button
                onClick={() => completeOrder(order.id)}
                disabled={actionInProgress[order.id]}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                }}
              >
                <CheckCheck size={16} />
                Complete Handover
              </button>
            ) : (
              <div style={{
                width: "100%",
                padding: "8px",
                borderRadius: 10,
                textAlign: "center",
                fontSize: 12,
                fontWeight: 800,
                background: isDark ? "rgba(16,185,129,0.12)" : "#D1FAE5",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "#10B981",
              }}>
                🔔 Ready! Collect at Counter
              </div>
            )}
          />

          {/* Column 2: Confirmed Queue */}
          <OrderColumn
            title="Confirmed Queue"
            count={orders.confirmed.length}
            themeVariant="sky"
            icon={CheckCircle2}
            isDark={isDark}
            orders={orders.confirmed}
            emptyMessage="Queue is clear"
            emptySub="Accepted tickets waiting for chef"
            actionInProgress={actionInProgress}
            checkedItems={checkedItems}
            toggleItemCheck={toggleItemCheck}
            renderAction={(order) => (
              <button
                onClick={() => startPreparing(order.id)}
                disabled={actionInProgress[order.id]}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #0EA5E9, #2563EB)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
                }}
              >
                <Flame size={16} />
                Start Cooking
              </button>
            )}
          />

          {/* Column 3: Cooking on Stove */}
          <OrderColumn
            title="Cooking on Stove"
            count={orders.preparing.length}
            themeVariant="orange"
            icon={Flame}
            isDark={isDark}
            orders={orders.preparing}
            emptyMessage="Pans are clear"
            emptySub="No dishes currently cooking"
            actionInProgress={actionInProgress}
            checkedItems={checkedItems}
            toggleItemCheck={toggleItemCheck}
            renderAction={(order) => (
              <button
                onClick={() => markReady(order.id)}
                disabled={actionInProgress[order.id]}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #F97316, #EA580C)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
                }}
              >
                <BellRing size={16} />
                Mark Ready for Pickup
              </button>
            )}
          />

          {/* Column 4: Ready at Counter */}
          <OrderColumn
            title="Ready at Counter"
            count={orders.ready.length}
            themeVariant="emerald"
            icon={BellRing}
            isDark={isDark}
            orders={orders.ready}
            emptyMessage="Counter is clear"
            emptySub="Packaged meals waiting for handover"
            actionInProgress={actionInProgress}
            checkedItems={checkedItems}
            toggleItemCheck={toggleItemCheck}
            renderAction={(order) => (
              <button
                onClick={() => completeOrder(order.id)}
                disabled={actionInProgress[order.id]}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 900,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                }}
              >
                <CheckCheck size={16} />
                Complete Handover
              </button>
            )}
          />

          {/* Column 5: Fulfilled Today */}
          {(() => {
            const completedOrdersToDisplay = orders.completed.filter(
              (o) => !dismissedCompletedIds.includes(o.id)
            );
            return (
              <OrderColumn
                title="Fulfilled Today"
                count={completedOrdersToDisplay.length}
                themeVariant="slate"
                icon={Check}
                isDark={isDark}
                orders={completedOrdersToDisplay}
                emptyMessage={dismissedCompletedIds.length > 0 ? "Tickets archived" : "No completed orders"}
                emptySub={dismissedCompletedIds.length > 0 ? "Click Restore to view" : "Fulfilled tickets appear here"}
                actionInProgress={actionInProgress}
                checkedItems={checkedItems}
                toggleItemCheck={toggleItemCheck}
                headerAction={
                  orders.completed.length > 0 ? (
                    <button
                      onClick={() => {
                        if (dismissedCompletedIds.length > 0) {
                          setDismissedCompletedIds([]);
                        } else {
                          setDismissedCompletedIds(orders.completed.map((o) => o.id));
                        }
                      }}
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 6,
                        border: isDark ? "1px solid #475569" : "1px solid #CBD5E1",
                        background: isDark ? "#1E293B" : "#FFFFFF",
                        color: isDark ? "#E2E8F0" : "#334155",
                        cursor: "pointer",
                      }}
                    >
                      {dismissedCompletedIds.length > 0 ? "Restore" : "Clear"}
                    </button>
                  ) : undefined
                }
                renderAction={() => (
                  <div style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 10,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    background: isDark ? "rgba(16,185,129,0.15)" : "#DCFCE7",
                    border: isDark ? "1px solid rgba(16,185,129,0.3)" : "1px solid #86EFAC",
                    color: isDark ? "#A7F3D0" : "#166534",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}>
                    <Check size={14} strokeWidth={3} />
                    Handed Over Successfully
                  </div>
                )}
              />
            );
          })()}
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
    ORDER COLUMN SUBCOMPONENT
   ══════════════════════════════════════════════════════════════ */

interface OrderColumnProps {
  title: string;
  count: number;
  themeVariant: "amber" | "sky" | "orange" | "emerald" | "slate";
  icon: any;
  isDark: boolean;
  orders: KitchenOrder[];
  emptyMessage: string;
  emptySub: string;
  actionInProgress: Record<string, boolean>;
  checkedItems: Record<string, Record<string, boolean>>;
  toggleItemCheck: (orderId: string, itemId: string) => void;
  renderAction: (order: KitchenOrder) => React.ReactNode;
  headerAction?: React.ReactNode;
}

function OrderColumn({
  title,
  count,
  themeVariant,
  icon: IconComponent,
  isDark,
  orders,
  emptyMessage,
  emptySub,
  actionInProgress,
  checkedItems,
  toggleItemCheck,
  renderAction,
  headerAction,
}: OrderColumnProps) {
  // Clear, vibrant, high-contrast column header styling
  const variantConfig = {
    amber: {
      headerBg: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
      headerBorder: isDark ? "rgba(245, 158, 11, 0.4)" : "#FDE68A",
      headerText: isDark ? "#FDE68A" : "#92400E",
      badgeBg: "#F59E0B",
      badgeText: "#0F172A",
    },
    sky: {
      headerBg: isDark ? "rgba(14, 165, 233, 0.15)" : "#E0F2FE",
      headerBorder: isDark ? "rgba(14, 165, 233, 0.4)" : "#BAE6FD",
      headerText: isDark ? "#BAE6FD" : "#075985",
      badgeBg: "#0EA5E9",
      badgeText: "#FFFFFF",
    },
    orange: {
      headerBg: isDark ? "rgba(249, 115, 22, 0.15)" : "#FFEDD5",
      headerBorder: isDark ? "rgba(249, 115, 22, 0.4)" : "#FED7AA",
      headerText: isDark ? "#FED7AA" : "#9A3412",
      badgeBg: "#F97316",
      badgeText: "#FFFFFF",
    },
    emerald: {
      headerBg: isDark ? "rgba(16, 185, 129, 0.15)" : "#D1FAE5",
      headerBorder: isDark ? "rgba(16, 185, 129, 0.4)" : "#A7F3D0",
      headerText: isDark ? "#A7F3D0" : "#065F46",
      badgeBg: "#10B981",
      badgeText: "#FFFFFF",
    },
    slate: {
      headerBg: isDark ? "rgba(148, 163, 184, 0.12)" : "#E2E8F0",
      headerBorder: isDark ? "rgba(148, 163, 184, 0.25)" : "#CBD5E1",
      headerText: isDark ? "#E2E8F0" : "#334155",
      badgeBg: isDark ? "#475569" : "#64748B",
      badgeText: "#FFFFFF",
    },
  }[themeVariant];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      borderRadius: 22,
      background: isDark ? "#0F172A" : "#E2E8F0",
      border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #CBD5E1",
      overflow: "hidden",
      minHeight: 740,
      boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      {/* Column Header */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{
          padding: "8px 12px",
          borderRadius: 14,
          background: variantConfig.headerBg,
          border: `1px solid ${variantConfig.headerBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: variantConfig.headerText }}>
            <IconComponent size={16} strokeWidth={2.5} />
            <span style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {title}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {headerAction}
            <span style={{
              padding: "2px 8px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 900,
              background: variantConfig.badgeBg,
              color: variantConfig.badgeText,
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}>
              {count}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Scroll List */}
      <div style={{
        flex: 1,
        padding: "0 10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
      }}>
        {orders.length === 0 ? (
          <div style={{
            height: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 20,
            borderRadius: 16,
            border: isDark ? "2px dashed #1E293B" : "2px dashed #CBD5E1",
            color: isDark ? "#64748B" : "#94A3B8",
            marginTop: 10,
          }}>
            <Sparkles size={22} style={{ marginBottom: 6, opacity: 0.5 }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#94A3B8" : "#475569" }}>
              {emptyMessage}
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              {emptySub}
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isDark={isDark}
              actionInProgress={actionInProgress}
              checkedItems={checkedItems[order.id] || {}}
              toggleItemCheck={(itemId) => toggleItemCheck(order.id, itemId)}
              renderAction={renderAction(order)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
    ORDER CARD (HIGH CONTRAST, TACTILE, CHEF-FRIENDLY)
   ══════════════════════════════════════════════════════════════ */

interface OrderCardProps {
  order: KitchenOrder;
  isDark: boolean;
  actionInProgress: Record<string, boolean>;
  checkedItems: Record<string, boolean>;
  toggleItemCheck: (itemId: string) => void;
  renderAction: React.ReactNode;
}

function OrderCard({
  order,
  isDark,
  actionInProgress,
  checkedItems,
  toggleItemCheck,
  renderAction,
}: OrderCardProps) {
  const isBusy = actionInProgress[order.id];

  // Destination Pill details
  const getDestinationBadge = (type: string, detail: string) => {
    switch (type) {
      case "TABLE_QR":
        return {
          icon: <Utensils size={13} />,
          label: "Dine-In",
          detail,
          bg: isDark ? "rgba(16,185,129,0.18)" : "#DCFCE7",
          border: isDark ? "rgba(16,185,129,0.5)" : "#86EFAC",
          color: isDark ? "#A7F3D0" : "#166534",
        };
      case "HALL_DELIVERY":
        return {
          icon: <Home size={13} />,
          label: "Hall Delivery",
          detail,
          bg: isDark ? "rgba(59,130,246,0.18)" : "#DBEAFE",
          border: isDark ? "rgba(59,130,246,0.5)" : "#93C5FD",
          color: isDark ? "#BFDBFE" : "#1E40AF",
        };
      case "DEPARTMENT_DELIVERY":
        return {
          icon: <Building2 size={13} />,
          label: "Dept Delivery",
          detail,
          bg: isDark ? "rgba(168,85,247,0.18)" : "#F3E8FF",
          border: isDark ? "rgba(168,85,247,0.5)" : "#D8B4FE",
          color: isDark ? "#E9D5FF" : "#6B21A8",
        };
      default:
        return {
          icon: <ShoppingBag size={13} />,
          label: "Counter Pickup",
          detail,
          bg: isDark ? "rgba(245,158,11,0.18)" : "#FEF3C7",
          border: isDark ? "rgba(245,158,11,0.5)" : "#FDE68A",
          color: isDark ? "#FDE68A" : "#92400E",
        };
    }
  };

  const dest = getDestinationBadge(order.destination.type, order.destination.detail);

  const waitMinutes = Math.floor(order.smartQueue.waitingTimeSeconds / 60);
  const isUrgent = waitMinutes >= 14 || order.smartQueue.isDelayed;

  return (
    <div style={{
      borderRadius: 18,
      padding: 14,
      background: isDark ? "#141D2F" : "#FFFFFF",
      border: isUrgent
        ? "1.5px solid #EF4444"
        : isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #CBD5E1",
      boxShadow: isUrgent
        ? "0 4px 14px rgba(239, 68, 68, 0.2)"
        : isDark ? "0 6px 16px rgba(0,0,0,0.25)" : "0 3px 10px rgba(0,0,0,0.06)",
      opacity: isBusy ? 0.5 : 1,
      pointerEvents: isBusy ? "none" : "auto",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}>
      {/* Top Header: Order #, Queue Rank & Timer */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        borderBottom: isDark ? "1px solid #1E293B" : "1px solid #F1F5F9",
        paddingBottom: 10,
        marginBottom: 10,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 18,
              fontWeight: 900,
              fontFamily: "monospace",
              color: isDark ? "#FFFFFF" : "#0F172A",
              letterSpacing: "-0.5px",
            }}>
              #{order.orderNumber}
            </span>

            {order.smartQueue.queuePosition && (
              <span style={{
                background: isDark ? "rgba(15,118,110,0.3)" : "#CCFBF1",
                color: "#0F766E",
                fontSize: 10,
                fontWeight: 900,
                padding: "2px 6px",
                borderRadius: 6,
                border: "1px solid rgba(15,118,110,0.4)",
              }}>
                {order.smartQueue.queuePosition}
              </span>
            )}
          </div>

          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? "#94A3B8" : "#475569",
            marginTop: 2,
          }}>
            {order.customer.name} {order.customer.studentId ? `(${order.customer.studentId})` : ""}
          </div>
        </div>

        {/* Live Timer Pill */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 900,
            fontFamily: "monospace",
            background: isUrgent
              ? "rgba(239, 68, 68, 0.2)"
              : waitMinutes < 8
              ? isDark ? "rgba(16,185,129,0.2)" : "#DCFCE7"
              : isDark ? "rgba(245,158,11,0.2)" : "#FEF3C7",
            border: isUrgent
              ? "1px solid #EF4444"
              : waitMinutes < 8
              ? isDark ? "1px solid #10B981" : "#86EFAC"
              : isDark ? "1px solid #F59E0B" : "#FDE68A",
            color: isUrgent
              ? "#EF4444"
              : waitMinutes < 8
              ? isDark ? "#6EE7B7" : "#166534"
              : isDark ? "#FCD34D" : "#B45309",
          }}>
            <Clock size={11} strokeWidth={2.5} />
            {order.smartQueue.waitingTimeFormatted}
          </div>

          <div style={{ fontSize: 10, color: isDark ? "#64748B" : "#94A3B8", marginTop: 2, fontWeight: 700 }}>
            Est ~{order.smartQueue.estimatedPrepTimeMinutes}m
          </div>
        </div>
      </div>

      {/* Destination Chip */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 10,
        background: dest.bg,
        border: `1px solid ${dest.border}`,
        color: dest.color,
        fontSize: 11,
        fontWeight: 800,
        marginBottom: 10,
      }}>
        {dest.icon}
        <span style={{ textTransform: "uppercase", fontSize: 10 }}>{dest.label}</span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dest.detail}</span>
      </div>

      {/* Interactive Food Items Checklist */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          color: isDark ? "#64748B" : "#94A3B8",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}>
          <span>Items Checklist</span>
          <span>{order.totalItemCount} Total</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {order.items.map((item) => {
            const isChecked = checkedItems[item.id] || false;
            return (
              <div
                key={item.id}
                onClick={() => toggleItemCheck(item.id)}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: isChecked
                    ? isDark ? "rgba(16,185,129,0.12)" : "#DCFCE7"
                    : isDark ? "#0B1120" : "#F8FAFC",
                  border: isChecked
                    ? isDark ? "1px solid rgba(16,185,129,0.4)" : "1px solid #86EFAC"
                    : isDark ? "1px solid #1E293B" : "1px solid #E2E8F0",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  opacity: isChecked ? 0.6 : 1,
                  textDecoration: isChecked ? "line-through" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span style={{
                    minWidth: 24,
                    height: 20,
                    borderRadius: 6,
                    background: isChecked ? "#10B981" : "#F59E0B",
                    color: isChecked ? "#FFFFFF" : "#0F172A",
                    fontSize: 11,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {item.quantity}×
                  </span>

                  <span style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: isDark ? "#FFFFFF" : "#0F172A",
                  }}>
                    {item.name}
                  </span>
                </div>

                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: isChecked ? "none" : isDark ? "1px solid #475569" : "1px solid #CBD5E1",
                  background: isChecked ? "#10B981" : "transparent",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {isChecked && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Special Chef Notes Callout */}
        {order.items.some((i) => i.specialInstructions) && (
          <div style={{
            marginTop: 8,
            padding: "6px 10px",
            borderRadius: 8,
            background: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
            border: isDark ? "1px solid rgba(245,158,11,0.4)" : "1px solid #FDE68A",
            color: isDark ? "#FDE68A" : "#92400E",
            fontSize: 11,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
            <span>
              {order.items.find((i) => i.specialInstructions)?.specialInstructions}
            </span>
          </div>
        )}

        {/* Order Notes */}
        {order.notes && (
          <div style={{
            marginTop: 6,
            padding: "6px 10px",
            borderRadius: 8,
            background: isDark ? "#1E293B" : "#F1F5F9",
            color: isDark ? "#CBD5E1" : "#475569",
            fontSize: 11,
            fontWeight: 600,
          }}>
            <strong style={{ color: "#0F766E" }}>Note: </strong>
            {order.notes}
          </div>
        )}
      </div>

      {/* Action Button Container */}
      <div style={{
        borderTop: isDark ? "1px solid #1E293B" : "1px solid #F1F5F9",
        paddingTop: 10,
      }}>
        {renderAction}
      </div>
    </div>
  );
}
