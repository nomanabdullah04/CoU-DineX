"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
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
  LogOut,
  ChevronRight,
  Download,
  Store,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
}

export const ADMIN_SECTIONS: NavItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
  { id: "students", label: "Students", icon: <Users size={18} /> },
  { id: "staff", label: "Staff", icon: <ShieldCheck size={18} /> },
  { id: "verifications", label: "Verifications", icon: <UserCheck size={18} /> },
  { id: "menu", label: "Menu", icon: <UtensilsCrossed size={18} /> },
  { id: "categories", label: "Categories", icon: <Tags size={18} /> },
  { id: "orders", label: "Orders", icon: <ShoppingBag size={18} /> },
  { id: "kitchen", label: "Kitchen", icon: <ChefHat size={18} /> },
  { id: "delivery", label: "Delivery", icon: <Bike size={18} /> },
  { id: "inventory", label: "Inventory", icon: <PackageOpen size={18} /> },
  { id: "payments", label: "Payments", icon: <CreditCard size={18} /> },
  { id: "reviews", label: "Reviews", icon: <Star size={18} /> },
  { id: "complaints", label: "Complaints", icon: <MessageSquareWarning size={18} /> },
  { id: "rewards", label: "Rewards", icon: <Award size={18} /> },
  { id: "notifications", label: "Notifications", icon: <BellRing size={18} /> },
  { id: "analytics", label: "Analytics", icon: <LineChart size={18} /> },
  { id: "security", label: "Security", icon: <LockKeyhole size={18} /> },
  { id: "settings", label: "Settings", icon: <Sliders size={18} /> },
];

interface AdminSidebarProps {
  activeSection: string;
  onSelectSection: (id: string) => void;
  pendingCounts?: {
    verifications?: number;
    complaints?: number;
    lowStock?: number;
  };
  currentUser?: {
    fullName?: string;
    role?: string;
  } | null;
}

export function AdminSidebar({
  activeSection,
  onSelectSection,
  pendingCounts,
  currentUser,
}: AdminSidebarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      style={{
        width: 260,
        background: "var(--surface, #FFFFFF)",
        borderRight: "1px solid var(--border, #E2E8F0)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 40,
        overflowY: "auto",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border, #E2E8F0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size="sm" />
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 6,
              background: "#0F766E",
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.5px",
            }}
          >
            ADMIN
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {ADMIN_SECTIONS.map((item) => {
          const isActive = activeSection === item.id;
          let badgeCount: number | undefined;
          let badgeBg = "#F59E0B";

          if (item.id === "verifications" && pendingCounts?.verifications) {
            badgeCount = pendingCounts.verifications;
          } else if (item.id === "complaints" && pendingCounts?.complaints) {
            badgeCount = pendingCounts.complaints;
            badgeBg = "#EF4444";
          } else if (item.id === "inventory" && pendingCounts?.lowStock) {
            badgeCount = pendingCounts.lowStock;
            badgeBg = "#F97316";
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 12px",
                borderRadius: 12,
                background: isActive ? "var(--primary-light, #FFF7ED)" : "transparent",
                color: isActive ? "var(--primary, #FF6B00)" : "var(--txt-2, #475569)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: isActive ? "var(--primary, #FF6B00)" : "var(--txt-muted, #94A3B8)" }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {badgeCount && badgeCount > 0 ? (
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: badgeBg,
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {badgeCount}
                </span>
              ) : isActive ? (
                <ChevronRight size={14} color="var(--primary, #FF6B00)" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* User profile & Sign Out footer */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--border, #E2E8F0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface-2, #F8FAFC)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--txt, #0F172A)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {currentUser?.fullName || "Admin"}
          </div>
          <div style={{ fontSize: 11, color: "var(--txt-muted, #64748B)" }}>
            {currentUser?.role || "SUPER_ADMIN"}
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          style={{
            background: "transparent",
            border: "none",
            color: "#EF4444",
            cursor: "pointer",
            padding: 6,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
