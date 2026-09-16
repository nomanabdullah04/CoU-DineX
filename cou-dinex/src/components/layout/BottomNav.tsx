"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ShoppingBag, Map, User } from "lucide-react";

const MOBILE_NAV = [
  { label: "Home",    href: "/home",    icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Orders",  href: "/orders",  icon: ShoppingBag },
  { label: "Map",     href: "/map",     icon: Map },
  { label: "Profile", href: "/profile", icon: User },
] as const;

interface BottomNavProps { cartItemCount?: number; }

export function BottomNav({ cartItemCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        height: 64,
        background: "rgba(var(--surface-rgb, 255,255,255), 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 4px",
        zIndex: 300,
      }}
      className="flex lg:hidden"
      aria-label="Mobile navigation"
    >
      {MOBILE_NAV.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        const isOrders = href === "/orders";

        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: "8px 0",
              textDecoration: "none",
              color: isActive ? "var(--primary)" : "var(--txt-muted)",
              position: "relative",
              transition: "color 150ms",
            }}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
          >
            {/* Top active indicator */}
            {isActive && (
              <span style={{
                position: "absolute",
                top: 4, width: 20, height: 3,
                borderRadius: 99,
                background: "var(--primary)",
              }} aria-hidden="true" />
            )}

            {/* Icon */}
            <span style={{ position: "relative" }}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} aria-hidden="true" />
              {/* Badge */}
              {isOrders && cartItemCount > 0 && (
                <span
                  style={{
                    position: "absolute", top: -6, right: -6,
                    width: 16, height: 16, borderRadius: "50%",
                    background: "var(--accent)", color: "white",
                    fontSize: 9, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  aria-label={`${cartItemCount} items`}
                >
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              )}
            </span>

            {/* Label */}
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, lineHeight: 1 }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
