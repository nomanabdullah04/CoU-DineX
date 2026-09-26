import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Role, DeliveryStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      user.role === Role.DELIVERY_AGENT ||
      user.role === Role.CAFETERIA_ADMIN ||
      user.role === Role.SUPER_ADMIN;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, latitude, longitude } = body;

    if (!orderId || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "orderId, latitude, and longitude (numbers) are required." },
        { status: 400 }
      );
    }

    // Find agent profile
    const agent = await prisma.deliveryAgent.findUnique({
      where: { userId: user.userId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Delivery agent profile not found." },
        { status: 404 }
      );
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryTracking: true },
    });

    if (!order || !order.deliveryTracking) {
      return NextResponse.json(
        { error: "Order tracking record not found." },
        { status: 404 }
      );
    }

    // STRICT PRIVACY CHECK:
    // Only share and record location while transit is actively in progress
    if (order.deliveryTracking.status !== DeliveryStatus.ON_THE_WAY) {
      return NextResponse.json(
        {
          error:
            "Location updates are only permitted while active delivery is in transit (ON_THE_WAY). Tracking automatically stops after delivery.",
        },
        { status: 400 }
      );
    }

    const currentLogs = Array.isArray(order.deliveryTracking.trackingLogs)
      ? (order.deliveryTracking.trackingLogs as any[])
      : [];

    // Append breadcrumb location point
    const breadcrumb = {
      lat: latitude,
      lng: longitude,
      timestamp: new Date().toISOString(),
    };

    // Keep last 30 location pings to maintain light database payload
    const updatedLogs = [...currentLogs.slice(-29), breadcrumb];

    await prisma.$transaction([
      prisma.deliveryTracking.update({
        where: { orderId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          trackingLogs: updatedLogs,
        },
      }),
      prisma.deliveryAgent.update({
        where: { id: agent.id },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Rider location updated successfully.",
      coordinates: { latitude, longitude },
    });
  } catch (error) {
    console.error("[Delivery Location API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update location." },
      { status: 500 }
    );
  }
}
