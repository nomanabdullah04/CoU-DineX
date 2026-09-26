"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  ChefHat,
  ShoppingBag,
  Truck,
  PackageCheck,
  CreditCard,
  AlertTriangle,
  GraduationCap,
  XCircle,
  HelpCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { NotificationType, NOTIFICATION_CONFIGS } from "@/lib/notifications/types";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=6");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Quiet fail if offline/background
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 12 seconds for real-time kitchen & payment events
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, actionUrl?: string | null) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (actionUrl) {
        setIsOpen(false);
        router.push(actionUrl);
      }
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setLoading(false);
    }
  };

  // Icon resolver based on type
  const renderIcon = (type: NotificationType) => {
    const config = NOTIFICATION_CONFIGS[type] || NOTIFICATION_CONFIGS[NotificationType.SYSTEM_NOTIFICATION];
    const props = { size: 16, color: config.badgeColor };

    switch (type) {
      case NotificationType.ORDER_CONFIRMED:
        return <CheckCircle2 {...props} />;
      case NotificationType.ORDER_PREPARING:
        return <ChefHat {...props} />;
      case NotificationType.ORDER_READY:
        return <ShoppingBag {...props} />;
      case NotificationType.ORDER_OUT_FOR_DELIVERY:
        return <Truck {...props} />;
      case NotificationType.ORDER_DELIVERED:
        return <PackageCheck {...props} />;
      case NotificationType.PAYMENT_SUCCESS:
        return <CreditCard {...props} />;
      case NotificationType.PAYMENT_FAILED:
        return <AlertTriangle {...props} />;
      case NotificationType.STUDENT_VERIFIED:
        return <GraduationCap {...props} />;
      case NotificationType.STUDENT_REJECTED:
        return <XCircle {...props} />;
      case NotificationType.MORE_INFORMATION_REQUIRED:
        return <HelpCircle {...props} />;
      case NotificationType.SPECIAL_OFFER:
        return <Sparkles {...props} />;
      default:
        return <Bell {...props} />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          background: isOpen ? "var(--surface-2)" : "transparent",
          color: "var(--txt-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "background 150ms ease",
        }}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 10,
              background: "#EF4444",
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 2px var(--surface)",
              animation: "pulse 2s infinite",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxWidth: "92vw",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            boxShadow: "0 18px 40px -10px rgba(0, 0, 0, 0.22)",
            zIndex: 9999,
            overflow: "hidden",
            animation: "fadeIn 150ms ease",
          }}
        >
          {/* Popover Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 6px",
                }}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--txt-muted)" }}>
                <Bell size={28} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>No notifications yet</p>
                <p style={{ fontSize: 11, margin: "4px 0 0 0", opacity: 0.8 }}>
                  Real-time kitchen, payment, and student alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const config = NOTIFICATION_CONFIGS[item.type] || NOTIFICATION_CONFIGS[NotificationType.SYSTEM_NOTIFICATION];

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.actionUrl)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      background: item.isRead ? "transparent" : "var(--surface-2)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      cursor: "pointer",
                      transition: "background 150ms ease",
                    }}
                  >
                    {/* Icon Bubble */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: config.badgeBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {renderIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: item.isRead ? 600 : 800,
                            color: "var(--txt)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.title}
                        </h4>
                        <span style={{ fontSize: 10, color: "var(--txt-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {formatTime(item.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: 12,
                          color: item.isRead ? "var(--txt-muted)" : "var(--txt-2)",
                          margin: "0 0 4px 0",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.body}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: config.badgeColor,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                          }}
                        >
                          {config.label}
                        </span>

                        {!item.isRead && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "var(--primary)",
                              display: "inline-block",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Popover Footer */}
          <div
            style={{
              padding: "10px 16px",
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--primary)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>Open Notification Center &amp; Preferences</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
