"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { useCart } from "@/contexts/CartContext";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showNav?: boolean;
  cartItemCount?: number;
  notificationCount?: number;
}

export function AppShell({
  children,
  title,
  showHeader = true,
  showNav = true,
  cartItemCount,
  notificationCount = 0,
}: AppShellProps) {
  const { itemCount } = useCart();
  const effectiveCartCount = cartItemCount !== undefined ? cartItemCount : itemCount;
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Desktop Sidebar */}
      {showNav && <Sidebar />}

      {/* Main column — offset by sidebar on desktop */}
      <div className={showNav ? "app-main" : ""}>
        {/* Header */}
        {showHeader && (
          <Header
            title={title}
            cartItemCount={effectiveCartCount}
            notificationCount={notificationCount}
            showDesktopBrand={!showNav}
          />
        )}

        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: "20px 16px",
          }}
          className="md:px-6 lg:px-8"
        >
          {/* Bottom padding for mobile bottom nav */}
          <div className={showNav ? "pb-[80px] lg:pb-4" : ""}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {showNav && <BottomNav cartItemCount={effectiveCartCount} />}
    </div>
  );
}
