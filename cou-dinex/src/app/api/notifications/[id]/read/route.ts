import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/notifications/notification-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await markNotificationAsRead(user.userId, id);

    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("[Notifications API] Error marking notification read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification read" },
      { status: 500 }
    );
  }
}
