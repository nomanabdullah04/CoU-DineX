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
} from "lucide-react";

export default function KitchenDisplayPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [dismissedCompletedIds, setDismissedCompletedIds] = useState<string[]>([]);

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
    pollIntervalMs: 4000,
    autoRefresh: true,
    soundEnabled,
  });

  // Live Digital Clock
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

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const isDark = theme === "dark";

  if (isLoading) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center min-h-screen ${isDark ? "bg-[#090D16] text-white" : "bg-slate-50 text-slate-950"}`}>
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center shadow-xl shadow-teal-700/25 mb-4 animate-bounce">
          <ChefHat size={34} />
        </div>
        <h2 className="text-xl font-black font-kds-ticket tracking-wider">Connecting to Kitchen Display System...</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Synchronizing live tickets with central cafeteria</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center min-h-screen p-6 text-center ${isDark ? "bg-[#090D16] text-white" : "bg-slate-50 text-slate-950"}`}>
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 border border-red-500/20">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-extrabold font-kds-display mb-2">Kitchen Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
          {error.includes("Unauthorized") || error.includes("Kitchen staff")
            ? "Only authorized cafeteria kitchen staff and administrators can access the Kitchen Display System."
            : error}
        </p>
        <div className="flex gap-3">
          <Link
            href="/login?callbackUrl=/kitchen"
            className="px-5 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-all no-underline shadow-lg shadow-teal-700/25 cursor-pointer"
          >
            Log in as Kitchen Staff
          </Link>
          <button
            onClick={() => refresh()}
            className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const counts = data?.counts || { totalActive: 0, new: 0, confirmed: 0, preparing: 0, ready: 0, completed: 0 };
  const orders = data?.orders || { newOrders: [], confirmed: [], preparing: [], ready: [], completed: [] };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-200 ${isDark ? "dark bg-[#080C14] text-white" : "bg-[#F1F5F9] text-slate-950"}`}>
      {/* ════════════════════════════════════════════════════════
          1. WORLD-CLASS KDS MASTER HEADER (NO MORE SQUISHED BUTTONS)
         ════════════════════════════════════════════════════════ */}
      <header className={`px-6 py-3.5 border-b sticky top-0 z-40 backdrop-blur-xl transition-all ${
        isDark ? "bg-[#0E1526]/95 border-slate-800 shadow-xl shadow-black/25" : "bg-white/95 border-slate-300 shadow-sm"
      }`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left Section: Admin Return + Branding & Station */}
          <div className="flex items-center gap-3.5 w-full lg:w-auto justify-between lg:justify-start">
            <Link
              href="/admin"
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all no-underline flex items-center gap-2 shadow-sm ${
                isDark
                  ? "bg-slate-800/90 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 hover:border-slate-600"
                  : "bg-slate-100 border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-200"
              }`}
              title="Return to Admin Dashboard"
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              <span className="font-kds-display tracking-tight text-xs font-bold">Admin Hub</span>
            </Link>

            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-700 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-700/30 flex-shrink-0">
                <ChefHat size={24} />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className={`text-base sm:text-lg font-black font-kds-ticket tracking-wider leading-none ${isDark ? "text-white" : "text-slate-950"}`}>
                    CoU DineX Kitchen OS
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black font-kds-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE SYNC
                  </span>
                </div>
                <p className={`text-xs mt-1 font-medium font-display flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  <span>Central Cafeteria</span>
                  <span className="opacity-40">•</span>
                  <span>Station: <strong className={isDark ? "text-teal-400" : "text-teal-700"}>{data?.staff?.name || "Kitchen Chef"}</strong></span>
                </p>
              </div>
            </div>
          </div>

          {/* Center Section: Centered Floating Telemetry & Clock Island */}
          <div className={`flex items-center gap-5 px-5 py-2 rounded-2xl border shadow-sm ${
            isDark ? "bg-[#0A0E17] border-slate-700/80 text-white shadow-black/40" : "bg-slate-50 border-slate-300 text-slate-950 shadow-slate-200/50"
          }`}>
            {/* Avg Kitchen Prep Time */}
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? "bg-teal-950/80 text-teal-400" : "bg-teal-100 text-teal-700"}`}>
                <Timer size={17} />
              </div>
              <div>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Avg Prep</div>
                <div className={`text-xs font-black font-kds-mono ${isDark ? "text-white" : "text-slate-950"}`}>
                  {data?.telemetry?.avgWaitMinutes || 0} min
                </div>
              </div>
            </div>

            <div className={`h-7 w-px ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

            {/* Active Queue Count */}
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-950/80 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              </div>
              <div>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Queue</div>
                <div className={`text-xs font-black font-kds-mono text-amber-600 dark:text-amber-400`}>
                  {counts.totalActive} Active
                </div>
              </div>
            </div>

            <div className={`h-7 w-px ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />

            {/* Large Digital Clock with Amber Glow */}
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-950/80 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                <Clock size={17} />
              </div>
              <div>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Kitchen Clock</div>
                <div className="text-sm sm:text-base font-black font-kds-mono text-amber-500 dark:text-amber-400 tracking-widest kds-timer-glow">
                  {currentTime}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Elegantly Spaced Touch Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Audio Chime Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-10 h-10 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                soundEnabled
                  ? isDark
                    ? "bg-teal-950/90 border-teal-500 text-teal-300 hover:bg-teal-900 shadow-sm"
                    : "bg-teal-50 border-teal-300 text-teal-800 hover:bg-teal-100 shadow-sm"
                  : isDark
                  ? "bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800"
                  : "bg-white border-slate-300 text-slate-400 hover:bg-slate-100"
              }`}
              title={soundEnabled ? "Audio Chime Enabled" : "Audio Chime Muted"}
            >
              {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`w-10 h-10 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800 shadow-sm"
                  : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => refresh()}
              disabled={isRefreshing}
              className={`w-10 h-10 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white shadow-sm"
                  : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm"
              }`}
              title="Refresh Kitchen Queue"
            >
              <RefreshCw size={17} className={isRefreshing ? "animate-spin text-teal-600" : ""} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className={`w-10 h-10 rounded-xl border transition-all cursor-pointer hidden sm:flex items-center justify-center ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white shadow-sm"
                  : "bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm"
              }`}
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="h-10 px-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Logout Kitchen Session"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline text-xs font-bold font-display">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          2. PURE 5-COLUMN KANBAN BOARD (FULL SCREEN STATION VIEW)
         ════════════════════════════════════════════════════════ */}
      <main className="flex-1 p-4 sm:p-5 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 min-w-[1300px] xl:min-w-0">
          {/* Column 1: New Orders */}
          <OrderColumn
            title="New Orders"
            count={counts.new}
            themeVariant="amber"
            icon={Inbox}
            isDark={isDark}
            orders={orders.newOrders}
            emptyMessage="No pending orders"
            emptySub="Incoming orders will chime here"
            actionInProgress={actionInProgress}
            renderAction={(order) => (
              <button
                onClick={() => acceptOrder(order.id)}
                disabled={actionInProgress[order.id]}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs font-kds-ticket tracking-wide transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-95"
              >
                <Check size={16} strokeWidth={3} />
                Accept Order
              </button>
            )}
          />

          {/* Column 2: Confirmed */}
          <OrderColumn
            title="Confirmed"
            count={counts.confirmed}
            themeVariant="sky"
            icon={CheckCircle2}
            isDark={isDark}
            orders={orders.confirmed}
            emptyMessage="Cooking queue empty"
            emptySub="Accepted tickets waiting for chef"
            actionInProgress={actionInProgress}
            renderAction={(order) => (
              <button
                onClick={() => startPreparing(order.id)}
                disabled={actionInProgress[order.id]}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-black text-xs font-kds-ticket tracking-wide transition-all shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-95"
              >
                <Flame size={16} />
                Start Cooking
              </button>
            )}
          />

          {/* Column 3: Preparing */}
          <OrderColumn
            title="Preparing"
            count={counts.preparing}
            themeVariant="orange"
            icon={Flame}
            isDark={isDark}
            orders={orders.preparing}
            emptyMessage="Stoves are clear"
            emptySub="No dishes currently on the stove"
            actionInProgress={actionInProgress}
            renderAction={(order) => (
              <button
                onClick={() => markReady(order.id)}
                disabled={actionInProgress[order.id]}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs font-kds-ticket tracking-wide transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-95"
              >
                <BellRing size={16} />
                Mark Ready for Pickup
              </button>
            )}
          />

          {/* Column 4: Ready for Pickup */}
          <OrderColumn
            title="Ready for Pickup"
            count={counts.ready}
            themeVariant="emerald"
            icon={BellRing}
            isDark={isDark}
            orders={orders.ready}
            emptyMessage="No orders on counter"
            emptySub="Packaged meals ready for handover"
            actionInProgress={actionInProgress}
            renderAction={(order) => (
              <button
                onClick={() => completeOrder(order.id)}
                disabled={actionInProgress[order.id]}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs font-kds-ticket tracking-wide transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-95"
              >
                <CheckCheck size={16} />
                Complete Handover
              </button>
            )}
          />

          {/* Column 5: Completed Today */}
          {(() => {
            const completedOrdersToDisplay = orders.completed.filter(
              (o) => !dismissedCompletedIds.includes(o.id)
            );
            return (
              <OrderColumn
                title="Completed Today"
                count={completedOrdersToDisplay.length}
                themeVariant="slate"
                icon={Check}
                isDark={isDark}
                orders={completedOrdersToDisplay}
                emptyMessage={dismissedCompletedIds.length > 0 ? "All completed tickets cleared" : "No completed tickets"}
                emptySub={dismissedCompletedIds.length > 0 ? "Click 'Restore' to view completed orders" : "Fulfilled orders will appear here"}
                actionInProgress={actionInProgress}
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        isDark
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                      title={dismissedCompletedIds.length > 0 ? "Restore completed tickets" : "Clear completed tickets from view"}
                    >
                      {dismissedCompletedIds.length > 0 ? "Restore" : "Clear"}
                    </button>
                  ) : undefined
                }
                renderAction={() => (
                  <div className={`w-full py-2.5 px-3 rounded-xl text-center text-xs font-black border flex items-center justify-center gap-1.5 ${
                    isDark
                      ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300"
                      : "bg-emerald-100 border-emerald-400 text-emerald-950"
                  }`}>
                    <Check size={15} strokeWidth={3} />
                    Handed Over to Student
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

/* ════════════════════════════════════════════════════════
    ELEGANT CURVED ORDER COLUMN SUBCOMPONENT
   ════════════════════════════════════════════════════════ */

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
  renderAction,
  headerAction,
}: OrderColumnProps) {
  // Variant theme configs for floating pill header
  const variantStyles = {
    amber: {
      pillBg: isDark ? "bg-amber-950/80 border-amber-500/70 text-amber-300" : "bg-amber-100 border-amber-400 text-amber-950",
      badgeBg: "bg-amber-500 text-slate-950",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
      pulseColor: "bg-amber-400",
    },
    sky: {
      pillBg: isDark ? "bg-sky-950/80 border-sky-500/70 text-sky-300" : "bg-sky-100 border-sky-400 text-sky-950",
      badgeBg: "bg-sky-500 text-white",
      glow: "shadow-[0_0_15px_rgba(14,165,233,0.2)]",
      pulseColor: "bg-sky-400",
    },
    orange: {
      pillBg: isDark ? "bg-orange-950/80 border-orange-500/70 text-orange-300" : "bg-orange-100 border-orange-400 text-orange-950",
      badgeBg: "bg-orange-500 text-white",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.2)]",
      pulseColor: "bg-orange-400",
    },
    emerald: {
      pillBg: isDark ? "bg-emerald-950/80 border-emerald-500/70 text-emerald-300" : "bg-emerald-100 border-emerald-400 text-emerald-950",
      badgeBg: "bg-emerald-500 text-white",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      pulseColor: "bg-emerald-400",
    },
    slate: {
      pillBg: isDark ? "bg-slate-800 border-slate-600 text-slate-200" : "bg-slate-200 border-slate-300 text-slate-950",
      badgeBg: isDark ? "bg-slate-700 text-white" : "bg-slate-800 text-white",
      glow: "shadow-none",
      pulseColor: "bg-slate-400",
    },
  }[themeVariant];

  return (
    <div className={`flex flex-col rounded-3xl border overflow-hidden min-h-[720px] transition-all duration-200 ${
      isDark
        ? "bg-[#0D1424] border-slate-800 shadow-xl backdrop-blur-md"
        : "bg-slate-200/90 border-slate-300 shadow-sm backdrop-blur-md"
    }`}>
      {/* Floating Pill Header */}
      <div className="p-3 pb-2.5">
        <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${variantStyles.pillBg} ${variantStyles.glow}`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${variantStyles.pulseColor} ${count > 0 ? "animate-pulse" : "opacity-40"}`} />
            <IconComponent size={17} strokeWidth={2.4} />
            <h3 className="text-xs font-black font-kds-ticket uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {headerAction}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-kds-mono shadow-sm ${variantStyles.badgeBg}`}>
              {count}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Scroll List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {orders.length === 0 ? (
          <div className={`h-48 flex flex-col items-center justify-center text-center p-5 rounded-2xl border-2 border-dashed ${
            isDark ? "border-slate-800 text-slate-400 bg-slate-950/30" : "border-slate-300 text-slate-500 bg-white/50"
          }`}>
            <Sparkles size={22} className="mb-2 opacity-50" />
            <span className={`text-xs font-bold font-kds-display ${isDark ? "text-slate-200" : "text-slate-800"}`}>{emptyMessage}</span>
            <span className={`text-[11px] mt-0.5 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{emptySub}</span>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isDark={isDark}
              actionInProgress={actionInProgress}
              renderAction={renderAction(order)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
    HIGH-CONTRAST, HIGHLY READABLE ORDER TICKET
   ════════════════════════════════════════════════════════ */

interface OrderCardProps {
  order: KitchenOrder;
  isDark: boolean;
  actionInProgress: Record<string, boolean>;
  renderAction: React.ReactNode;
}

function OrderCard({ order, isDark, actionInProgress, renderAction }: OrderCardProps) {
  const isBusy = actionInProgress[order.id];

  // Refined, ultra-high-contrast destination pill mapping
  const getDestinationBadge = (type: string, detail: string) => {
    switch (type) {
      case "TABLE_QR":
        return {
          icon: <Utensils size={14} className={isDark ? "text-emerald-300" : "text-emerald-950"} />,
          label: "Dine In",
          detail,
          style: isDark
            ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/70"
            : "bg-emerald-100 text-emerald-950 border-emerald-400",
        };
      case "HALL_DELIVERY":
        return {
          icon: <Home size={14} className={isDark ? "text-blue-300" : "text-blue-950"} />,
          label: "Hall Delivery",
          detail,
          style: isDark
            ? "bg-blue-950/90 text-blue-200 border-blue-500/70"
            : "bg-blue-100 text-blue-950 border-blue-400",
        };
      case "DEPARTMENT_DELIVERY":
        return {
          icon: <Building2 size={14} className={isDark ? "text-purple-300" : "text-purple-950"} />,
          label: "Dept Delivery",
          detail,
          style: isDark
            ? "bg-purple-950/90 text-purple-200 border-purple-500/70"
            : "bg-purple-100 text-purple-950 border-purple-400",
        };
      default:
        return {
          icon: <ShoppingBag size={14} className={isDark ? "text-amber-300" : "text-amber-950"} />,
          label: "Take Away",
          detail,
          style: isDark
            ? "bg-amber-950/90 text-amber-200 border-amber-500/70"
            : "bg-amber-100 text-amber-950 border-amber-400",
        };
    }
  };

  const destInfo = getDestinationBadge(order.destination.type, order.destination.detail);

  // Wait time color thresholds
  const waitMinutes = Math.floor(order.smartQueue.waitingTimeSeconds / 60);
  const waitBadgeColor =
    waitMinutes < 5
      ? isDark
        ? "bg-emerald-950 text-emerald-300 border-emerald-500/70 font-black"
        : "bg-emerald-100 text-emerald-950 border-emerald-400 font-black"
      : waitMinutes < 12
      ? isDark
        ? "bg-amber-950 text-amber-300 border-amber-500/70 font-black"
        : "bg-amber-100 text-amber-950 border-amber-400 font-black"
      : isDark
      ? "bg-red-950 text-red-300 border-red-500 font-black animate-pulse"
      : "bg-red-100 text-red-950 border-red-400 font-black animate-pulse";

  return (
    <div
      className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 border ${
        order.smartQueue.isDelayed
          ? "border-red-500 ring-2 ring-red-500/30"
          : isDark
          ? "bg-[#162032] border-slate-700 hover:border-slate-600 shadow-lg shadow-black/50"
          : "bg-white border-slate-300 hover:border-slate-400 shadow-md"
      } ${isBusy ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div>
        {/* Ticket Header: Large Order ID, Queue Rank & Timer */}
        <div className={`flex items-start justify-between gap-2 pb-3 border-b mb-3 ${isDark ? "border-slate-700" : "border-slate-200"}`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black font-kds-ticket tracking-wider ${isDark ? "text-white" : "text-slate-950"}`}>
                #{order.orderNumber}
              </span>
              {order.smartQueue.queuePosition && (
                <span className={`text-[10.5px] font-black font-kds-ticket uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                  isDark
                    ? "bg-teal-950 text-teal-300 border-teal-500/60"
                    : "bg-teal-100 text-teal-950 border-teal-400"
                }`}>
                  {order.smartQueue.queuePosition}
                </span>
              )}
            </div>
            <div className={`text-xs mt-0.5 font-bold truncate font-kds-display ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {order.customer.name}
            </div>
          </div>

          {/* Wait Time Counter */}
          <div className="flex flex-col items-end">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-kds-mono font-black px-2.5 py-1 rounded-xl border shadow-sm ${waitBadgeColor}`}
            >
              <Clock size={12} strokeWidth={2.5} />
              {order.smartQueue.waitingTimeFormatted}
            </span>
            <span className={`text-[11px] font-kds-mono font-bold mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Prep ~{order.smartQueue.estimatedPrepTimeMinutes}m
            </span>
          </div>
        </div>

        {/* Destination Chip (Clean, High Contrast) */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-kds-display mb-3.5 ${destInfo.style}`}>
          {destInfo.icon}
          <span className="tracking-wide uppercase text-[11px] font-black">{destInfo.label}</span>
          <span className="opacity-40">•</span>
          <span className="truncate font-bold text-xs">{destInfo.detail}</span>
        </div>

        {/* Food Items List (CRYSTAL CLEAR HIGH CONTRAST) */}
        <div className="space-y-3 mb-3.5">
          {order.items.map((item) => (
            <div key={item.id} className="text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 flex-1">
                  {/* High Contrast Gold Quantity Badge with Bold Black Text */}
                  <span className="inline-flex items-center justify-center min-w-[30px] h-6 px-1.5 rounded-lg bg-amber-400 text-slate-950 font-black font-kds-mono text-xs border border-amber-500 shadow-sm flex-shrink-0">
                    {item.quantity}×
                  </span>
                  {/* High-Legibility Food Item Name (White on dark, Slate-950 on light) */}
                  <span className={`font-kds-display text-[15px] font-black leading-snug tracking-tight ${
                    isDark ? "text-white" : "text-slate-950"
                  }`}>
                    {item.name}
                  </span>
                </div>
              </div>

              {/* Special Instructions Callout */}
              {item.specialInstructions && (
                <div className={`mt-1.5 ml-9 px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  isDark
                    ? "bg-amber-950/80 border-amber-500/60 text-amber-200"
                    : "bg-amber-100 border-amber-400 text-amber-950"
                }`}>
                  <span className="font-black text-amber-500 inline-flex items-center gap-1">
                    <AlertTriangle size={12} /> Special:
                  </span>
                  <span>{item.specialInstructions}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* General Order Notes */}
        {order.notes && (
          <div className={`mb-3 px-3 py-2 rounded-xl border text-xs font-semibold ${
            isDark
              ? "bg-slate-800/90 border-slate-700 text-slate-200"
              : "bg-slate-100 border-slate-300 text-slate-900"
          }`}>
            <span className="font-black text-teal-600 dark:text-teal-400 mr-1">Student Note:</span>
            {order.notes}
          </div>
        )}
      </div>

      {/* Action Button Container */}
      <div className={`pt-2.5 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}>
        {renderAction}
      </div>
    </div>
  );
}
