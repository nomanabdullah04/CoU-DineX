"use client";

import React, { useState, useEffect } from "react";
import {
  AdminBarChart,
  StatMetricCard,
} from "@/components/admin/AdminCharts";
import {
  Calendar,
  Download,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ChefHat,
  Package,
  Users,
  RotateCcw,
} from "lucide-react";

interface AnalyticsSectionProps {
  onExportClick?: () => void;
}

export function AnalyticsSection({ onExportClick }: AnalyticsSectionProps) {
  const [range, setRange] = useState<string>("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        let url = `/api/admin/analytics?range=${range}`;
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error("Fetch analytics error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [range, startDate, endDate]);

  const handleExport = (type: string) => {
    window.open(`/api/admin/export?type=${type}&format=csv`, "_blank");
  };

  if (loading && !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted, #64748B)" }}>
        Loading comprehensive database analytics...
      </div>
    );
  }

  const summary = data?.summary || {};
  const timeSeries = data?.timeSeries || [];
  const peakHours = data?.peakHours || [];
  const popularFoods = data?.popularFoods || [];

  // Transform time series for order volume chart
  const orderVolumeChartData = timeSeries.slice(-14).map((ts: any) => ({
    label: ts.date.slice(5), // MM-DD
    value: ts.orders,
    secondaryValue: ts.delivered,
    tooltip: `${ts.date}: ${ts.orders} Total Orders (${ts.delivered} Delivered, ${ts.cancelled} Cancelled)`,
  }));

  // Revenue chart data
  const revenueChartData = timeSeries.slice(-14).map((ts: any) => ({
    label: ts.date.slice(5),
    value: ts.revenue,
    tooltip: `${ts.date}: ৳${ts.revenue} Delivered Revenue`,
  }));

  // Peak hours chart data
  const peakHourChartData = peakHours.map((ph: any) => ({
    label: ph.formattedHour,
    value: ph.count,
    tooltip: `${ph.formattedHour}: ${ph.count} Orders`,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Header & Date Filters */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "16px 20px",
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
            Real-Time Campus Dining Analytics
          </h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Aggregated and visualized directly from PostgreSQL orders, kitchen times, and payments.
          </p>
        </div>

        {/* Date Filters & Export */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "var(--surface-2, #F8FAFC)", padding: 4, borderRadius: 12, border: "1px solid var(--border, #E2E8F0)" }}>
            {["7d", "30d", "90d", "1y"].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRange(r);
                  setStartDate("");
                  setEndDate("");
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: range === r ? 700 : 500,
                  background: range === r ? "var(--primary, #FF6B00)" : "transparent",
                  color: range === r ? "#FFFFFF" : "var(--txt-2, #475569)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export Dropdown / Button */}
          <button
            onClick={() => handleExport("orders")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
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
            <Download size={14} />
            <span>Export Orders (CSV)</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
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
          subtext="Net paid revenue"
          icon={<TrendingUp size={22} />}
          accentColor="#059669"
        />

        <StatMetricCard
          label="Kitchen Speed"
          value={`${summary.avgKitchenTimeMinutes || 18}m`}
          subtext="Avg prep time"
          icon={<ChefHat size={22} />}
          accentColor="#F59E0B"
        />

        <StatMetricCard
          label="Delivery Speed"
          value={`${summary.avgDeliveryTimeMinutes || 14}m`}
          subtext="Avg handover duration"
          icon={<Truck size={22} />}
          accentColor="#0F766E"
        />
      </div>

      {/* Main Charts Grid: Daily Orders & Revenue */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 20,
        }}
      >
        {/* Daily Orders Trend */}
        <div
          style={{
            background: "var(--surface, #FFFFFF)",
            border: "1px solid var(--border, #E2E8F0)",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
                Daily Order Volume (Last 14 Days)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
                Orange: Total placed • Green: Completed delivered
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, fontWeight: 700 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6B00" }} /> Orders
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} /> Delivered
              </span>
            </div>
          </div>

          <AdminBarChart data={orderVolumeChartData} height={200} barColor="#FF6B00" secondaryBarColor="#059669" />
        </div>

        {/* Daily Delivered Revenue Trend */}
        <div
          style={{
            background: "var(--surface, #FFFFFF)",
            border: "1px solid var(--border, #E2E8F0)",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Revenue Trend (৳ BDT)
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
              Revenue calculated solely on successfully delivered orders
            </p>
          </div>

          <AdminBarChart data={revenueChartData} height={200} barColor="#059669" valuePrefix="৳" />
        </div>
      </div>

      {/* Secondary Analytics: Peak Ordering Hours & Popular Foods */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 20,
        }}
      >
        {/* Peak Ordering Hours */}
        <div
          style={{
            background: "var(--surface, #FFFFFF)",
            border: "1px solid var(--border, #E2E8F0)",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
              Peak Campus Ordering Times
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
              Orders distributed across 24-hour university cafeteria cycles
            </p>
          </div>

          <AdminBarChart data={peakHourChartData} height={180} barColor="#3B82F6" />
        </div>

        {/* Most Popular Foods Table */}
        <div
          style={{
            background: "var(--surface, #FFFFFF)",
            border: "1px solid var(--border, #E2E8F0)",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
                Most Popular Foods
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
                Top performing dishes by quantity ordered
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary, #FF6B00)", background: "var(--primary-light, #FFF7ED)", padding: "3px 8px", borderRadius: 8 }}>
              Top 6
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {popularFoods.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--txt-muted)", padding: 20, fontSize: 13 }}>
                No food sales recorded yet.
              </div>
            ) : (
              popularFoods.map((f: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "var(--surface-2, #F8FAFC)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: idx < 3 ? "var(--primary, #FF6B00)" : "var(--border, #CBD5E1)",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--txt, #0F172A)" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "var(--txt-muted, #64748B)" }}>{f.category}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, color: "var(--txt, #0F172A)" }}>{f.quantitySold} sold</div>
                    <div style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>৳{f.totalRevenue}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
