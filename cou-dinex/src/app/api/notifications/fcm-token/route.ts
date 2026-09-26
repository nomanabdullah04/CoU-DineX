import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { registerFcmToken } from "@/lib/notifications/notification-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Valid FCM registration token is required" },
        { status: 400 }
      );
    }

    await registerFcmToken(user.userId, token);

    return NextResponse.json({
      success: true,
      message: "FCM registration token saved successfully",
    });
  } catch (error) {
    console.error("[Notifications API] Error registering FCM token:", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 }
    );
  }
}
