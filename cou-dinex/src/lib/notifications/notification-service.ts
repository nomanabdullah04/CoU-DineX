import { prisma } from "../prisma";
import {
  NotificationPayload,
  NotificationType,
  NOTIFICATION_CONFIGS,
  UserNotificationPreferences,
} from "./types";
import { fcmPushService } from "./fcm-service";

/**
 * Core Notification Service for CoU DineX
 * 
 * - Enforces user notification preferences strictly
 * - Anti-spam protection
 * - Creates database records
 * - Dispatches push notifications via FCM if token exists
 */

export async function sendNotification(payload: NotificationPayload) {
  const { userId, type, title, body, actionUrl, metadata } = payload;

  try {
    // 1. Check user existence
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreference: true },
    });

    if (!user) {
      console.warn(`[Notification Service] Target user ${userId} not found.`);
      return { success: false, reason: "User not found" };
    }

    // 2. Enforce User Notification Preferences
    const config = NOTIFICATION_CONFIGS[type];
    const preference = user.notificationPreference;

    if (preference && config) {
      const isAllowed = preference[config.preferenceKey];
      if (isAllowed === false) {
        console.log(`[Notification Service] Skipped notification for user ${userId}. Reason: User opted out of ${config.preferenceKey}`);
        return { success: false, reason: `User preference disabled for ${config.preferenceKey}` };
      }
    }

    // 3. Persist Notification in Database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        actionUrl: actionUrl || null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        isRead: false,
      },
    });

    // 4. Dispatch FCM Push Notification if enabled & token exists
    if (preference?.pushEnabled !== false && preference?.fcmToken) {
      fcmPushService.sendPushNotification({
        token: preference.fcmToken,
        title,
        body,
        actionUrl: actionUrl || undefined,
        data: {
          notificationId: notification.id,
          type: type.toString(),
        },
      }).catch((err) => {
        console.error("[Notification Service] Async FCM dispatch error:", err);
      });
    }

    return { success: true, notification };
  } catch (error) {
    console.error("[Notification Service] Error creating notification:", error);
    return { success: false, error };
  }
}

/**
 * Get paginated notifications and total unread count for a user
 */
export async function getUserNotifications(options: {
  userId: string;
  category?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const { userId, category, unreadOnly = false, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Filter types by category if requested
  let typeFilter: NotificationType[] | undefined = undefined;
  if (category && category !== "ALL") {
    typeFilter = Object.values(NotificationType).filter(
      (t) => NOTIFICATION_CONFIGS[t]?.category === category
    );
  }

  const whereClause: any = {
    userId,
    ...(unreadOnly ? { isRead: false } : {}),
    ...(typeFilter && typeFilter.length > 0 ? { type: { in: typeFilter } } : {}),
  };

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: whereClause }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + notifications.length < totalCount,
    },
    unreadCount,
  };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return { count: result.count };
}

/**
 * Get user's notification preferences with defaults
 */
export async function getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
  const preference = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    return {
      orderUpdates: true,
      paymentAlerts: true,
      studentVerification: true,
      specialOffers: true,
      systemAlerts: true,
      pushEnabled: true,
      hasFcmToken: false,
    };
  }

  return {
    orderUpdates: preference.orderUpdates,
    paymentAlerts: preference.paymentAlerts,
    studentVerification: preference.studentVerification,
    specialOffers: preference.specialOffers,
    systemAlerts: preference.systemAlerts,
    pushEnabled: preference.pushEnabled,
    hasFcmToken: !!preference.fcmToken,
  };
}

/**
 * Update user's notification preferences
 */
export async function updateUserPreferences(
  userId: string,
  data: Partial<Omit<UserNotificationPreferences, "hasFcmToken">>
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: {
      ...data,
    },
  });
}

/**
 * Register or update FCM registration token
 */
export async function registerFcmToken(userId: string, fcmToken: string) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      fcmToken,
      pushEnabled: true,
    },
    update: {
      fcmToken,
    },
  });
}
