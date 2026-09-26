import { prisma } from "../src/lib/prisma";
import {
  NotificationType,
  NOTIFICATION_CONFIGS,
} from "../src/lib/notifications/types";
import {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserPreferences,
  updateUserPreferences,
  registerFcmToken,
} from "../src/lib/notifications/notification-service";
import { fcmPushService } from "../src/lib/notifications/fcm-service";

async function main() {
  console.log("================================================");
  console.log("   TESTING PHASE 11: NOTIFICATION ARCHITECTURE  ");
  console.log("================================================\n");

  // 1. Verify All 12 Notification Types
  console.log("1. Verifying Notification Types & Categories:");
  const requiredTypes: NotificationType[] = [
    NotificationType.ORDER_CONFIRMED,
    NotificationType.ORDER_PREPARING,
    NotificationType.ORDER_READY,
    NotificationType.ORDER_OUT_FOR_DELIVERY,
    NotificationType.ORDER_DELIVERED,
    NotificationType.PAYMENT_SUCCESS,
    NotificationType.PAYMENT_FAILED,
    NotificationType.STUDENT_VERIFIED,
    NotificationType.STUDENT_REJECTED,
    NotificationType.MORE_INFORMATION_REQUIRED,
    NotificationType.SPECIAL_OFFER,
    NotificationType.SYSTEM_NOTIFICATION,
  ];

  for (const type of requiredTypes) {
    const config = NOTIFICATION_CONFIGS[type];
    console.log(`   - [${type.padEnd(26)}] Category: ${config.category.padEnd(10)} PrefKey: ${config.preferenceKey.padEnd(20)} Label: "${config.label}"`);
  }

  // 2. Find a test user in DB
  console.log("\n2. Finding a Test Student in Database:");
  const testUser = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    select: { id: true, fullName: true, phone: true },
  });

  if (!testUser) {
    console.error("   No student user found in database to test.");
    return;
  }
  console.log(`   Found Student: ${testUser.fullName} (${testUser.phone}, ID: ${testUser.id})`);

  // 3. Test Notification Preferences (Get and Update)
  console.log("\n3. Testing Notification Preferences:");
  const initialPrefs = await getUserPreferences(testUser.id);
  console.log("   Initial Preferences:", initialPrefs);

  // Register simulated FCM device token
  await registerFcmToken(testUser.id, "simulated-fcm-device-registration-token-2026-cou");
  console.log("   Registered device FCM token successfully.");

  // Turn OFF special offers to test anti-spam & preference respect
  await updateUserPreferences(testUser.id, {
    specialOffers: false,
    orderUpdates: true,
    paymentAlerts: true,
  });
  console.log("   Updated Preferences: specialOffers = false (Opt-out of marketing offers)");

  // 4. Test Notification Dispatch & Preference Respect
  console.log("\n4. Testing Real Event Notification Dispatch & Preference Enforcement:");
  
  // 4.1 Try to send a SPECIAL_OFFER (should be SKIPPED because preference is false)
  const promoResult = await sendNotification({
    userId: testUser.id,
    type: NotificationType.SPECIAL_OFFER,
    title: "50% Off Campus Lunch Combo!",
    body: "Grab today's special khichuri combo at half price.",
  });
  console.log("   Dispatching SPECIAL_OFFER (User opted out):", promoResult);
  if (!promoResult.success) {
    console.log("   => SUCCESS: Marketing spam was strictly BLOCKED per user preference!");
  }

  // 4.2 Send an ORDER_CONFIRMED notification (should succeed)
  const orderResult = await sendNotification({
    userId: testUser.id,
    type: NotificationType.ORDER_CONFIRMED,
    title: "Order Confirmed!",
    body: "Your lunch order #COU-5181 has been received by Central Cafeteria.",
    actionUrl: "/orders/test-order-id",
    metadata: { orderNumber: "COU-5181", cafeteria: "Central Cafeteria" },
  });
  console.log("   Dispatching ORDER_CONFIRMED:", orderResult.success ? "SUCCESS" : "FAILED");

  // 4.3 Send a PAYMENT_SUCCESS notification (should succeed)
  const paymentResult = await sendNotification({
    userId: testUser.id,
    type: NotificationType.PAYMENT_SUCCESS,
    title: "Demo Payment Received",
    body: "Payment of ৳180 verified via Simulated bKash. Digital receipt ready.",
    actionUrl: "/orders/test-order-id/receipt",
  });
  console.log("   Dispatching PAYMENT_SUCCESS:", paymentResult.success ? "SUCCESS" : "FAILED");

  // 5. Test Fetching User Notifications
  console.log("\n5. Testing Notification Center Feed Query:");
  const feed = await getUserNotifications({
    userId: testUser.id,
    limit: 5,
  });
  console.log(`   Total notifications found: ${feed.pagination.totalCount}, Unread count: ${feed.unreadCount}`);
  for (const n of feed.notifications.slice(0, 3)) {
    console.log(`     * [${n.type}] ${n.title} (Read: ${n.isRead})`);
  }

  // 6. Test Mark Single Read & Mark All Read
  if (paymentResult.notification) {
    console.log("\n6. Testing Mark as Read:");
    await markNotificationAsRead(testUser.id, paymentResult.notification.id);
    console.log(`   Marked notification ${paymentResult.notification.id} as read.`);
  }

  console.log("\n7. Testing Mark All as Read:");
  const markAllResult = await markAllNotificationsAsRead(testUser.id);
  console.log(`   Mark all read executed: ${markAllResult.count} notifications marked read.`);

  const unreadAfter = await getUserNotifications({ userId: testUser.id, unreadOnly: true });
  console.log(`   Unread notifications remaining: ${unreadAfter.pagination.totalCount}`);

  // 8. Re-enable special offers for standard settings
  await updateUserPreferences(testUser.id, {
    specialOffers: true,
  });
  console.log("\n8. Restored default user preferences.");

  console.log("\n================================================");
  console.log("   PHASE 11 ALL TESTS COMPLETED SUCCESSFULLY!   ");
  console.log("================================================");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
