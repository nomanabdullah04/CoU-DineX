"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, ShoppingBag, Map, Gift, User,
  Settings, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const NAV_ITEMS = [
  { label: "Home",       href: "/home",    icon: Home        },
  { label: "Explore",    href: "/explore", icon: Compass     },
  { label: "Orders",     href: "/orders",  icon: ShoppingBag },
  { label: "Campus Map", href: "/map",     icon: Map         },
  { label: "Rewards",    href: "/rewards", icon: Gift        },
  { label: "Profile",    href: "/profile", icon: User        },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Main navigation">

      {/* Logo */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
      }}>
        <Logo size="md" showSubtitle={true} href="/home" />
      </div>

      {/* Navigation */}
      <nav style={{ padding: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 12,
                textDecoration: "none", fontSize: 14, fontWeight: 500,
                transition: "background 150ms, color 150ms",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "white" : "var(--txt-2)",
                boxShadow: isActive ? "var(--shadow-primary)" : "none",
              }} aria-current={isActive ? "page" : undefined}>
                <Icon size={18} style={{ flexShrink: 0, color: isActive ? "white" : "var(--txt-muted)" }} />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.7)" }} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom: Settings only */}
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", padding: "10px 12px" }}>
        <Link href="/settings" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px", borderRadius: 12,
          textDecoration: "none", fontSize: 14, fontWeight: 500,
          color: "var(--txt-2)",
        }}>
          <Settings size={18} color="var(--txt-muted)" />
          Settings
        </Link>
      </div>
    </aside>
  );
}