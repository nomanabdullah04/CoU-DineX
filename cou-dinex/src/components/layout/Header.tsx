"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ShoppingCart, Sun, Moon, Menu, UtensilsCrossed, LogOut, User, Settings, Shield } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
  title?: string;
  cartItemCount?: number;
  notificationCount?: number;
  onMenuClick?: () => void;
}

interface SessionUser {
  fullName: string;
  email: string | null;
  role: string;
}

export function Header({
  title,
  cartItemCount = 0,
  notificationCount = 0,
  onMenuClick,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.authenticated) setUser(d.user); })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    setShowDropdown(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const iconBtn: React.CSSProperties = {
    width: 36, height: 36,
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 10, border: "none", cursor: "pointer",
    background: "transparent", color: "var(--txt-2)",
    transition: "background 150ms",
  };

  return (
    <header
      style={{
        position: "sticky", top: 0,
        height: 64,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center",
        padding: "0 16px", gap: 8,
        zIndex: 200,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      role="banner"
    >
      {/* Mobile: hamburger + logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="flex lg:hidden">
        <button onClick={onMenuClick} style={iconBtn} aria-label="Open menu">
          <Menu size={20} aria-hidden="true" />
        </button>
        <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }} aria-label={APP_NAME}>
          <div className="dinex-gradient-primary" style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UtensilsCrossed size={15} color="white" aria-hidden="true" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, color: "var(--txt)", letterSpacing: "-0.02em" }}>
            {APP_NAME}
          </span>
        </Link>
      </div>

      {/* Desktop: page title */}
      {title && (
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--txt)", flex: 1, margin: 0 }} className="hidden lg:block">
          {title}
        </h1>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <Link href="/notifications" style={{ ...iconBtn, position: "relative", textDecoration: "none" }} aria-label="Notifications">
        <Bell size={19} aria-hidden="true" />
        {notificationCount > 0 && (
          <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--error)", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </Link>

      {/* Cart */}
      <Link href="/cart" style={{ ...iconBtn, position: "relative", textDecoration: "none" }} aria-label="Cart">
        <ShoppingCart size={19} aria-hidden="true" />
        {cartItemCount > 0 && (
          <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--accent)", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {cartItemCount > 9 ? "9+" : cartItemCount}
          </span>
        )}
      </Link>

      {/* Theme toggle */}
      <button onClick={toggleTheme} style={iconBtn} aria-label="Toggle theme">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ── User & Direct Logout Button in Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* User Pill */}
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px 4px 6px",
              borderRadius: 20,
              background: "var(--surface-2, rgba(0,0,0,0.04))",
              border: "1px solid var(--border)",
              fontSize: 13,
              color: "var(--txt)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {initials}
            </div>
            <span style={{ fontWeight: 600, maxWidth: 110, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.fullName.split(" ")[0]}
            </span>
          </div>
        )}

        {/* Admin Switcher (If user is Admin) */}
        {user && (user.role === "CAFETERIA_ADMIN" || user.role === "SUPER_ADMIN") && (
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 13px",
              borderRadius: 10,
              background: "#0F766E",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(15, 118, 110, 0.25)",
            }}
          >
            <Shield size={14} />
            <span>Admin Panel</span>
          </Link>
        )}

        {/* DIRECT LOGOUT BUTTON (Always visible at top-right) */}
        <button
          id="direct-header-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 10,
            border: "1px solid #FCA5A5",
            background: "#FEF2F2",
            color: "#DC2626",
            fontSize: 13,
            fontWeight: 700,
            cursor: loggingOut ? "not-allowed" : "pointer",
            transition: "all 150ms ease",
            boxShadow: "0 1px 3px rgba(220, 38, 38, 0.1)",
          }}
          title="Log out of current account"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#DC2626";
            e.currentTarget.style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FEF2F2";
            e.currentTarget.style.color = "#DC2626";
          }}
        >
          <LogOut size={15} />
          <span>{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}