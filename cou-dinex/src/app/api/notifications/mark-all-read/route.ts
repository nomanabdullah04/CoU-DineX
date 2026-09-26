import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/notifications/notification-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await markAllNotificationsAsRead(user.userId);

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    });
  } catch (error) {
    console.error("[Notifications API] Error marking all read:", error);
    return NextResponse.json(
      { error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
