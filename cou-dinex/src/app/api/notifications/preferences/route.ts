import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/lib/notifications/notification-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getUserPreferences(user.userId);
    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error("[Notifications API] Error getting preferences:", error);
    return NextResponse.json(
      { error: "Failed to get notification preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      orderUpdates,
      paymentAlerts,
      studentVerification,
      specialOffers,
      systemAlerts,
      pushEnabled,
    } = body;

    const updated = await updateUserPreferences(user.userId, {
      ...(typeof orderUpdates === "boolean" ? { orderUpdates } : {}),
      ...(typeof paymentAlerts === "boolean" ? { paymentAlerts } : {}),
      ...(typeof studentVerification === "boolean" ? { studentVerification } : {}),
      ...(typeof specialOffers === "boolean" ? { specialOffers } : {}),
      ...(typeof systemAlerts === "boolean" ? { systemAlerts } : {}),
      ...(typeof pushEnabled === "boolean" ? { pushEnabled } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: updated,
    });
  } catch (error) {
    console.error("[Notifications API] Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
