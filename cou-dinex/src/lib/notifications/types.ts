import { NotificationType } from "@prisma/client";

export { NotificationType };

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationMetaConfig {
  type: NotificationType;
  category: "ORDERS" | "PAYMENTS" | "STUDENT" | "OFFERS" | "SYSTEM";
  preferenceKey: "orderUpdates" | "paymentAlerts" | "studentVerification" | "specialOffers" | "systemAlerts";
  iconName: string;
  badgeColor: string;
  badgeBg: string;
  label: string;
}

export const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationMetaConfig> = {
  // 1. Orders
  [NotificationType.ORDER_CONFIRMED]: {
    type: NotificationType.ORDER_CONFIRMED,
    category: "ORDERS",
    preferenceKey: "orderUpdates",
    iconName: "CheckCircle2",
    badgeColor: "#059669",
    badgeBg: "#D1FAE5",
    label: "Order Confirmed",
  },
  [NotificationType.ORDER_PREPARING]: {
    type: NotificationType.ORDER_PREPARING,
    category: "ORDERS",
    preferenceKey: "orderUpdates",
    iconName: "ChefHat",
    badgeColor: "#1D4ED8",
    badgeBg: "#DBEAFE",
    label: "Cooking / Preparing",
  },
  [NotificationType.ORDER_READY]: {
    type: NotificationType.ORDER_READY,
    category: "ORDERS",
    preferenceKey: "orderUpdates",
    iconName: "ShoppingBag",
    badgeColor: "#0D9488",
    badgeBg: "#CCFBF1",
    label: "Ready for Pickup",
  },
  [NotificationType.ORDER_OUT_FOR_DELIVERY]: {
    type: NotificationType.ORDER_OUT_FOR_DELIVERY,
    category: "ORDERS",
    preferenceKey: "orderUpdates",
    iconName: "Truck",
    badgeColor: "#7C3AED",
    badgeBg: "#EDE9FE",
    label: "Out for Delivery",
  },
  [NotificationType.ORDER_DELIVERED]: {
    type: NotificationType.ORDER_DELIVERED,
    category: "ORDERS",
    preferenceKey: "orderUpdates",
    iconName: "PackageCheck",
    badgeColor: "#047857",
    badgeBg: "#D1FAE5",
    label: "Order Delivered",
  },

  // 2. Payments
  [NotificationType.PAYMENT_SUCCESS]: {
    type: NotificationType.PAYMENT_SUCCESS,
    category: "PAYMENTS",
    preferenceKey: "paymentAlerts",
    iconName: "CreditCard",
    badgeColor: "#059669",
    badgeBg: "#D1FAE5",
    label: "Payment Received",
  },
  [NotificationType.PAYMENT_FAILED]: {
    type: NotificationType.PAYMENT_FAILED,
    category: "PAYMENTS",
    preferenceKey: "paymentAlerts",
    iconName: "AlertTriangle",
    badgeColor: "#DC2626",
    badgeBg: "#FEE2E2",
    label: "Payment Failed",
  },

  // 3. Student Verification
  [NotificationType.STUDENT_VERIFIED]: {
    type: NotificationType.STUDENT_VERIFIED,
    category: "STUDENT",
    preferenceKey: "studentVerification",
    iconName: "GraduationCap",
    badgeColor: "#059669",
    badgeBg: "#D1FAE5",
    label: "Student ID Verified",
  },
  [NotificationType.STUDENT_REJECTED]: {
    type: NotificationType.STUDENT_REJECTED,
    category: "STUDENT",
    preferenceKey: "studentVerification",
    iconName: "XCircle",
    badgeColor: "#DC2626",
    badgeBg: "#FEE2E2",
    label: "Verification Declined",
  },
  [NotificationType.MORE_INFORMATION_REQUIRED]: {
    type: NotificationType.MORE_INFORMATION_REQUIRED,
    category: "STUDENT",
    preferenceKey: "studentVerification",
    iconName: "HelpCircle",
    badgeColor: "#D97706",
    badgeBg: "#FEF3C7",
    label: "ID Info Required",
  },

  // 4. Special Offers
  [NotificationType.SPECIAL_OFFER]: {
    type: NotificationType.SPECIAL_OFFER,
    category: "OFFERS",
    preferenceKey: "specialOffers",
    iconName: "Sparkles",
    badgeColor: "#E11D48",
    badgeBg: "#FFE4E6",
    label: "Campus Special Offer",
  },

  // 5. System Notifications
  [NotificationType.SYSTEM_NOTIFICATION]: {
    type: NotificationType.SYSTEM_NOTIFICATION,
    category: "SYSTEM",
    preferenceKey: "systemAlerts",
    iconName: "Bell",
    badgeColor: "#4B5563",
    badgeBg: "#F3F4F6",
    label: "System Notice",
  },

  // Legacy fallbacks
  [NotificationType.ORDER_UPDATE]: {
    type: NotificationType.ORDER_UPDATE,
    category: "ORDERS",
    preferenceKey: "orderUpdates",
    iconName: "Clock",
    badgeColor: "#0D9488",
    badgeBg: "#CCFBF1",
    label: "Order Update",
  },
  [NotificationType.DELIVERY_ALERT]: {
    type: NotificationType.DELIVERY_ALERT,
    category: "ORDERS",
    preferenceKey: "orderUpdates",
    iconName: "Truck",
    badgeColor: "#7C3AED",
    badgeBg: "#EDE9FE",
    label: "Delivery Alert",
  },
  [NotificationType.PROMOTION]: {
    type: NotificationType.PROMOTION,
    category: "OFFERS",
    preferenceKey: "specialOffers",
    iconName: "Tag",
    badgeColor: "#E11D48",
    badgeBg: "#FFE4E6",
    label: "Promotion",
  },
  [NotificationType.SYSTEM]: {
    type: NotificationType.SYSTEM,
    category: "SYSTEM",
    preferenceKey: "systemAlerts",
    iconName: "Bell",
    badgeColor: "#4B5563",
    badgeBg: "#F3F4F6",
    label: "System",
  },
  [NotificationType.VERIFICATION]: {
    type: NotificationType.VERIFICATION,
    category: "STUDENT",
    preferenceKey: "studentVerification",
    iconName: "GraduationCap",
    badgeColor: "#059669",
    badgeBg: "#D1FAE5",
    label: "Verification",
  },
};

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  actionUrl?: string;
}

export interface UserNotificationPreferences {
  orderUpdates: boolean;
  paymentAlerts: boolean;
  studentVerification: boolean;
  specialOffers: boolean;
  systemAlerts: boolean;
  pushEnabled: boolean;
  hasFcmToken: boolean;
}
