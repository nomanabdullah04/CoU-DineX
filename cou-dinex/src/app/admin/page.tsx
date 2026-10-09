"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AnalyticsSection } from "@/components/admin/AnalyticsSection";
import { SecuritySection } from "@/components/admin/SecuritySection";
import { StudentsSection } from "@/components/admin/StudentsSection";
import { StaffSection } from "@/components/admin/StaffSection";
import { OrdersSection } from "@/components/admin/OrdersSection";
import { InventorySection } from "@/components/admin/InventorySection";
import { PaymentsSection } from "@/components/admin/PaymentsSection";
import { ComplaintsSection } from "@/components/admin/ComplaintsSection";
import { RewardsSection } from "@/components/admin/RewardsSection";
import { NotificationsSection } from "@/components/admin/NotificationsSection";
import { CategoriesSection } from "@/components/admin/CategoriesSection";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { ReviewsSection } from "@/components/admin/ReviewsSection";
import { StatMetricCard } from "@/components/admin/AdminCharts";
import {
  Users,
  ShieldCheck,
  UserCheck,
  UtensilsCrossed,
  Tags,
  ShoppingBag,
  ChefHat,
  Bike,
  PackageOpen,
  CreditCard,
  Star,
  MessageSquareWarning,
  Award,
  BellRing,
  LineChart,
  LockKeyhole,
  Sliders,
  ArrowRight,
  TrendingUp,
  Download,
  AlertTriangle,
} from "lucide-react";

export default function CompleteAdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialAdminData() {
      try {
        const [authRes, analyticsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/admin/analytics?range=30d"),
        ]);

        if (authRes.status === 401 || authRes.status === 403) {
          router.push("/login?callbackUrl=/admin");
          return;
        }

        const authJson = await authRes.json();
        const role = authJson.user?.role;
        if (role !== "SUPER_ADMIN" && role !== "CAFETERIA_ADMIN") {
          router.push("/login?callbackUrl=/admin");
          return;
        }

        setCurrentUser(authJson.user);

        if (analyticsRes.ok) {
          const analyticsJson = await analyticsRes.json();
          setOverviewData(analyticsJson);
        }
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialAdminData();
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", color: "#64748B", fontFamily: "var(--font-sans), sans-serif" }}>
        Verifying administrative credentials & initializing campus command center...
      </div>
    );
  }

  const summary = overviewData?.summary || {};

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* 18-Section Navigation Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        pendingCounts={{
          verifications: summary.pendingVerificationsCount,
          complaints: summary.pendingComplaintsCount,
          lowStock: summary.lowStockInventoryCount,
        }}
        currentUser={currentUser}
      />

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxWidth: 1400 }}>
        {/* ================= 1. OVERVIEW SECTION ================= */}
        {activeSection === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0F172A" }}>
                  Executive Campus Command Overview
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                  Centralized command console for Comilla University cafeteria operations, order traffic, and student security.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => window.open("/api/admin/export?type=orders&format=csv", "_blank")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 16px",
                    borderRadius: 12,
                    background: "#0F766E",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(15, 118, 110, 0.2)",
                  }}
                >
                  <Download size={15} />
                  <span>Export Master Data</span>
                </button>
              </div>
            </div>

            {/* High-Level Pulse Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <StatMetricCard
                label="Total Orders"
                value={summary.totalOrders || 0}
                subtext={`${summary.totalDeliveredOrders || 0} completed`}
                icon={<ShoppingBag size={22} />}
                accentColor="#FF6B00"
              />

              <StatMetricCard
                label="Delivered Revenue"
                value={`৳${(summary.totalRevenue || 0).toLocaleString()}`}
                subtext="Total settled revenue"
                icon={<TrendingUp size={22} />}
                accentColor="#059669"
              />

              <StatMetricCard
                label="Verified Students"
                value={summary.totalStudents || 0}
                subtext={`${summary.pendingVerificationsCount || 0} pending review`}
                icon={<UserCheck size={22} />}
                accentColor="#3B82F6"
              />

              <StatMetricCard
                label="Low Stock Alerts"
                value={summary.lowStockInventoryCount || 0}
                subtext="Items need restocking"
                icon={<AlertTriangle size={22} />}
                accentColor="#EF4444"
              />
            </div>

            {/* Quick Actions Shortcuts to Specialized Dashboards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {/* Direct Link to Live Kitchen KDS */}
              <Link
                href="/kitchen"
                target="_blank"
                style={{
                  textDecoration: "none",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 18,
                  padding: "20px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "#0F766E15", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChefHat size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                      Kitchen Display (KDS)
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                      Real-time chef line & prep timer
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="#0F766E" />
              </Link>

              {/* Direct Link to Live Delivery Fleet */}
              <Link
                href="/delivery"
                target="_blank"
                style={{
                  textDecoration: "none",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 18,
                  padding: "20px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "#FF6B0015", color: "#FF6B00", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bike size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                      Delivery Rider Console
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                      Campus courier dispatch & OTPs
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="#FF6B00" />
              </Link>

              {/* Direct Link to Student Verification Queue */}
              <button
                onClick={() => setActiveSection("verifications")}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 18,
                  padding: "20px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "#3B82F615", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                      Verification Queue
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                      {summary.pendingVerificationsCount || 0} students pending
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} color="#3B82F6" />
              </button>
            </div>

            {/* Embedded Live Database Analytics Component in Overview */}
            <AnalyticsSection />
          </div>
        )}

        {/* ================= 2. STUDENTS SECTION ================= */}
        {activeSection === "students" && <StudentsSection />}

        {/* ================= 3. STAFF SECTION ================= */}
        {activeSection === "staff" && <StaffSection />}

        {/* ================= 4. VERIFICATIONS SECTION ================= */}
        {activeSection === "verifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Student ID Verification Console</h2>
              <Link
                href="/admin/verifications"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "#0F766E",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Open Full Verification Queue Page <ArrowRight size={14} />
              </Link>
            </div>
            <StudentsSection />
          </div>
        )}

        {/* ================= 5. MENU SECTION ================= */}
        {activeSection === "menu" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Campus Menu Management</h2>
              <Link
                href="/admin/menu"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "#FF6B00",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Open Menu Editor & Pricing Tool <ArrowRight size={14} />
              </Link>
            </div>
            <InventorySection />
          </div>
        )}

        {/* ================= 6. CATEGORIES SECTION ================= */}
        {activeSection === "categories" && <CategoriesSection />}

        {/* ================= 7. ORDERS SECTION ================= */}
        {activeSection === "orders" && <OrdersSection />}

        {/* ================= 8. KITCHEN SECTION ================= */}
        {activeSection === "kitchen" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px 28px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Kitchen Display System (KDS) & Chef Line</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                  Live audio alerts, preparation timers, order ticket routing, and instant ready marks.
                </p>
              </div>
              <Link
                href="/kitchen"
                target="_blank"
                style={{
                  padding: "10px 20px",
                  borderRadius: 12,
                  background: "#0F766E",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ChefHat size={18} /> Launch Kitchen Display
              </Link>
            </div>
            <OrdersSection />
          </div>
        )}

        {/* ================= 9. DELIVERY SECTION ================= */}
        {activeSection === "delivery" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px 28px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Campus Delivery Operations</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                  Delivery agent status, hall/department couriers, pickup OTPs, and handover tracking.
                </p>
              </div>
              <Link
                href="/delivery"
                target="_blank"
                style={{
                  padding: "10px 20px",
                  borderRadius: 12,
                  background: "#FF6B00",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Bike size={18} /> Launch Rider Dashboard
              </Link>
            </div>
            <StaffSection />
          </div>
        )}

        {/* ================= 10. INVENTORY SECTION ================= */}
        {activeSection === "inventory" && <InventorySection />}

        {/* ================= 11. PAYMENTS SECTION ================= */}
        {activeSection === "payments" && <PaymentsSection />}

        {/* ================= 12. REVIEWS SECTION ================= */}
        {activeSection === "reviews" && <ReviewsSection />}

        {/* ================= 13. COMPLAINTS SECTION ================= */}
        {activeSection === "complaints" && <ComplaintsSection />}

        {/* ================= 14. REWARDS SECTION ================= */}
        {activeSection === "rewards" && <RewardsSection />}

        {/* ================= 15. NOTIFICATIONS SECTION ================= */}
        {activeSection === "notifications" && <NotificationsSection />}

        {/* ================= 16. ANALYTICS SECTION ================= */}
        {activeSection === "analytics" && <AnalyticsSection />}

        {/* ================= 17. SECURITY SECTION ================= */}
        {activeSection === "security" && <SecuritySection />}

        {/* ================= 18. SETTINGS SECTION ================= */}
        {activeSection === "settings" && <SettingsSection />}
      </main>
    </div>
  );
}
