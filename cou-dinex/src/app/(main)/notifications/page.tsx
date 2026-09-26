"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
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
  Settings,
  X,
  Sliders,
  Filter,
  Check,
  Info,
  Shield,
  Smartphone,
} from "lucide-react";
import { NotificationType, NOTIFICATION_CONFIGS, UserNotificationPreferences } from "@/lib/notifications/types";
import { requestPushNotificationPermission } from "@/lib/firebase/client";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export default function NotificationCenterPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<UserNotificationPreferences>({
    orderUpdates: true,
    paymentAlerts: true,
    studentVerification: true,
    specialOffers: true,
    systemAlerts: true,
    pushEnabled: true,
    hasFcmToken: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const categoryParam = activeFilter === "ALL" || activeFilter === "UNREAD" ? "ALL" : activeFilter;
      const unreadParam = activeFilter === "UNREAD" ? "&unreadOnly=true" : "";
      const res = await fetch(`/api/notifications?category=${categoryParam}${unreadParam}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user preferences
  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) setPreferences(data.preferences);
      }
    } catch {
      // Quiet fail
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleMarkAsRead = async (id: string, actionUrl?: string | null) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (actionUrl) {
        router.push(actionUrl);
      }
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefSaveSuccess(false);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        setPrefSaveSuccess(true);
        setTimeout(() => setPrefSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to update preferences", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const renderIcon = (type: NotificationType) => {
    const config = NOTIFICATION_CONFIGS[type] || NOTIFICATION_CONFIGS[NotificationType.SYSTEM_NOTIFICATION];
    const props = { size: 18, color: config.badgeColor };

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

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filterTabs = [
    { id: "ALL", label: "All Alerts" },
    { id: "UNREAD", label: `Unread (${unreadCount})` },
    { id: "ORDERS", label: "Orders" },
    { id: "PAYMENTS", label: "Payments" },
    { id: "STUDENT", label: "Student ID" },
    { id: "OFFERS", label: "Offers" },
    { id: "SYSTEM", label: "System" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 80px 16px" }}>
      {/* Header Title & Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "var(--txt)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: "#EF4444",
                  color: "#FFFFFF",
                }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: 0 }}>
            Real-time kitchen milestones, payment confirmations, and campus dining notices.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: "8px 14px",
                borderRadius: 12,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--txt)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <CheckCheck size={16} color="var(--primary)" />
              <span>Mark all as read</span>
            </button>
          )}

          {/* Preferences Button */}
          <button
            onClick={() => setShowPreferences(true)}
            style={{
              padding: "8px 14px",
              borderRadius: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--txt)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <Sliders size={16} />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 10,
          overflowX: "auto",
        }}
      >
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 12,
                border: "none",
                background: isSelected ? "var(--primary)" : "var(--surface-2)",
                color: isSelected ? "#FFFFFF" : "var(--txt-2)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 150ms ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notification Stream */}
      {loading ? (
        <div style={{ padding: "60px 16px", textAlign: "center", color: "var(--txt-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 14, margin: 0 }}>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "60px 24px",
            textAlign: "center",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <Bell size={32} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: "0 0 6px 0" }}>
            No Notifications Found
          </h3>
          <p style={{ fontSize: 13, color: "var(--txt-muted)", maxWidth: 360, margin: "0 auto" }}>
            {activeFilter === "UNREAD"
              ? "You are all caught up! No unread notifications right now."
              : "Notifications triggered by your orders, payments, and campus alerts will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map((item) => {
            const config = NOTIFICATION_CONFIGS[item.type] || NOTIFICATION_CONFIGS[NotificationType.SYSTEM_NOTIFICATION];

            return (
              <div
                key={item.id}
                style={{
                  background: item.isRead ? "var(--surface)" : "var(--surface-2)",
                  border: item.isRead ? "1px solid var(--border)" : "1.5px solid rgba(15, 118, 110, 0.3)",
                  borderRadius: 18,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  boxShadow: item.isRead ? "none" : "0 4px 14px rgba(15, 118, 110, 0.08)",
                  transition: "all 150ms ease",
                }}
              >
                {/* Notification Icon */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
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

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: item.isRead ? 700 : 900,
                          color: "var(--txt)",
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--primary)",
                            display: "inline-block",
                          }}
                        />
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: config.badgeBg,
                          color: config.badgeColor,
                          textTransform: "uppercase",
                        }}
                      >
                        {config.label}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--txt-muted)", whiteSpace: "nowrap" }}>
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      color: item.isRead ? "var(--txt-muted)" : "var(--txt)",
                      margin: "0 0 10px 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.body}
                  </p>

                  {/* Actions Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {item.actionUrl && (
                      <Link
                        href={item.actionUrl}
                        onClick={() => {
                          if (!item.isRead) handleMarkAsRead(item.id);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--primary)",
                          textDecoration: "none",
                        }}
                      >
                        <span>View Details</span>
                        <ExternalLink size={13} />
                      </Link>
                    )}

                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--txt-muted)",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Check size={13} />
                        <span>Mark as read</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showPreferences && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sliders size={20} color="var(--primary)" />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                  Notification Preferences
                </h3>
              </div>
              <button
                onClick={() => setShowPreferences(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--txt-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", maxHeight: "65vh", overflowY: "auto" }}>
              <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                Choose which campus dining notifications you want to receive. We respect your attention and never send promotional spam.
              </p>

              {prefSaveSuccess && (
                <div
                  style={{
                    background: "#D1FAE5",
                    color: "#065F46",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Preferences saved successfully!</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* 1. Order Status Updates */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)", margin: 0 }}>
                      Order Status Updates
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "2px 0 0 0" }}>
                      Cooking started, meal ready for pickup, out for delivery.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.orderUpdates}
                    onChange={(e) => setPreferences({ ...preferences, orderUpdates: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
                  />
                </div>

                {/* 2. Payment Alerts */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)", margin: 0 }}>
                      Payment Confirmations
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "2px 0 0 0" }}>
                      bKash, Nagad, Rocket, card and cash receipt receipts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.paymentAlerts}
                    onChange={(e) => setPreferences({ ...preferences, paymentAlerts: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
                  />
                </div>

                {/* 3. Student Verification Alerts */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)", margin: 0 }}>
                      Student ID Verification
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "2px 0 0 0" }}>
                      University ID approval status, rejection, or info requested.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.studentVerification}
                    onChange={(e) => setPreferences({ ...preferences, studentVerification: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
                  />
                </div>

                {/* 4. Special Offers */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)", margin: 0 }}>
                      Special Offers &amp; Campus Deals
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "2px 0 0 0" }}>
                      Student discounts, cafeteria lunch combos, and holiday specials.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.specialOffers}
                    onChange={(e) => setPreferences({ ...preferences, specialOffers: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
                  />
                </div>

                {/* 5. System Notifications */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)", margin: 0 }}>
                      System &amp; Cafeteria Notices
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "2px 0 0 0" }}>
                      Central Dining Hall open/closed hours, maintenance alerts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.systemAlerts}
                    onChange={(e) => setPreferences({ ...preferences, systemAlerts: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
                  />
                </div>

                {/* 6. Push / FCM Enablement */}
                <div
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    marginTop: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Smartphone size={20} color="var(--primary)" />
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                        FCM Push Notifications
                      </h4>
                      <p style={{ fontSize: 11, color: "var(--txt-muted)", margin: "2px 0 0 0" }}>
                        Instant browser &amp; mobile device push alerts.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        const token = await requestPushNotificationPermission();
                        if (token) {
                          alert("Push notifications enabled on this device!");
                          setPreferences((p) => ({ ...p, pushEnabled: true, hasFcmToken: true }));
                        } else {
                          alert("Could not enable push notifications. Please check your browser permission settings.");
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: preferences.hasFcmToken ? "#D1FAE5" : "var(--primary)",
                        color: preferences.hasFcmToken ? "#047857" : "#FFFFFF",
                        border: preferences.hasFcmToken ? "1px solid #10B981" : "none",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {preferences.hasFcmToken ? "Device Connected ✓" : "Enable Push"}
                    </button>
                    <input
                      type="checkbox"
                      checked={preferences.pushEnabled}
                      onChange={(e) => setPreferences({ ...preferences, pushEnabled: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                background: "var(--surface)",
              }}
            >
              <button
                onClick={() => setShowPreferences(false)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--txt)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>

              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                style={{
                  padding: "9px 20px",
                  borderRadius: 12,
                  background: "var(--primary)",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: savingPrefs ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "var(--shadow-primary)",
                }}
              >
                {savingPrefs ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
