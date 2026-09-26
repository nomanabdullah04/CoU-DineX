import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Role, OrderStatus, DeliveryStatus, PaymentStatus, NotificationType } from "@prisma/client";
import { sendNotification } from "@/lib/notifications/notification-service";

interface DeliveryActionBody {
  orderId: string;
  action: "ACCEPT" | "PICKUP" | "START" | "COMPLETE";
  otp?: string;
  note?: string;
}

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
      return NextResponse.json(
        { error: "Forbidden. Delivery agent credentials required." },
        { status: 403 }
      );
    }

    const body: DeliveryActionBody = await req.json();
    const { orderId, action, otp, note } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { error: "orderId and action are required." },
        { status: 400 }
      );
    }

    // Find agent profile
    let agent = await prisma.deliveryAgent.findUnique({
      where: { userId: user.userId },
    });
    if (!agent) {
      agent = await prisma.deliveryAgent.create({
        data: {
          userId: user.userId,
          vehicleType: "Motorbike / Campus Bicycle",
          isAvailable: true,
        },
      });
    }

    // Find order with delivery tracking
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryTracking: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1. ACTION: ACCEPT DELIVERY
    if (action === "ACCEPT") {
      if (order.deliveryTracking?.agentId && order.deliveryTracking.agentId !== agent.id) {
        return NextResponse.json(
          { error: "This delivery order is already assigned to another rider." },
          { status: 400 }
        );
      }

      const currentLogs = Array.isArray(order.deliveryTracking?.trackingLogs)
        ? (order.deliveryTracking?.trackingLogs as any[])
        : [];

      const updated = await prisma.deliveryTracking.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          agentId: agent.id,
          status: DeliveryStatus.ASSIGNED,
          trackingLogs: [
            ...currentLogs,
            {
              event: "DELIVERY_ASSIGNED",
              agentId: agent.id,
              agentName: user.fullName,
              timestamp: new Date().toISOString(),
              note,
            },
          ],
        },
        update: {
          agentId: agent.id,
          status: DeliveryStatus.ASSIGNED,
          trackingLogs: [
            ...currentLogs,
            {
              event: "DELIVERY_ASSIGNED",
              agentId: agent.id,
              agentName: user.fullName,
              timestamp: new Date().toISOString(),
              note,
            },
          ],
        },
      });

      // Notify student
      await sendNotification({
        userId: order.userId,
        type: NotificationType.ORDER_OUT_FOR_DELIVERY,
        title: "Delivery Rider Assigned!",
        body: `Rider ${user.fullName} (${agent.vehicleType}) has accepted your delivery order #${order.orderNumber}.`,
        actionUrl: `/orders/${order.id}`,
      });

      return NextResponse.json({
        success: true,
        message: "Delivery accepted successfully.",
        deliveryTracking: updated,
      });
    }

    // Ensure the order is assigned to this agent for subsequent actions
    if (order.deliveryTracking?.agentId !== agent.id && user.role === Role.DELIVERY_AGENT) {
      return NextResponse.json(
        { error: "This order is not assigned to you." },
        { status: 403 }
      );
    }

    const currentLogs = Array.isArray(order.deliveryTracking?.trackingLogs)
      ? (order.deliveryTracking?.trackingLogs as any[])
      : [];

    // 2. ACTION: PICKUP FROM CAFETERIA
    if (action === "PICKUP") {
      const updated = await prisma.deliveryTracking.update({
        where: { orderId: order.id },
        data: {
          status: DeliveryStatus.PICKED_UP,
          pickupTime: new Date(),
          trackingLogs: [
            ...currentLogs,
            {
              event: "STATUS_CHANGED_TO_PICKED_UP",
              timestamp: new Date().toISOString(),
              note,
            },
          ],
        },
      });

      await sendNotification({
        userId: order.userId,
        type: NotificationType.ORDER_READY,
        title: "Meal Picked Up by Rider!",
        body: `Rider ${user.fullName} collected your food from the Central Cafeteria counter. Preparing for departure.`,
        actionUrl: `/orders/${order.id}`,
      });

      return NextResponse.json({
        success: true,
        message: "Order marked as picked up from cafeteria counter.",
        deliveryTracking: updated,
      });
    }

    // 3. ACTION: START DELIVERY (ON THE WAY)
    if (action === "START") {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.OUT_FOR_DELIVERY },
        }),
        prisma.deliveryTracking.update({
          where: { orderId: order.id },
          data: {
            status: DeliveryStatus.ON_THE_WAY,
            trackingLogs: [
              ...currentLogs,
              {
                event: "STATUS_CHANGED_TO_OUT_FOR_DELIVERY",
                timestamp: new Date().toISOString(),
                note,
              },
            ],
          },
        }),
      ]);

      await sendNotification({
        userId: order.userId,
        type: NotificationType.ORDER_OUT_FOR_DELIVERY,
        title: "Food Out for Delivery!",
        body: `Rider ${user.fullName} is on the way to your destination. Please have your delivery OTP ready.`,
        actionUrl: `/orders/${order.id}`,
      });

      return NextResponse.json({
        success: true,
        message: "Transit started. Live tracking is now active.",
      });
    }

    // 4. ACTION: COMPLETE HANDOVER (REQUIRES SECURE OTP)
    if (action === "COMPLETE") {
      if (!otp || typeof otp !== "string") {
        return NextResponse.json(
          { error: "Delivery OTP is required to complete handover." },
          { status: 400 }
        );
      }

      const expectedOtp = order.deliveryTracking?.deliveryOtp;
      if (!expectedOtp) {
        return NextResponse.json(
          { error: "No delivery OTP generated for this order." },
          { status: 400 }
        );
      }

      if (otp.trim() !== expectedOtp.trim()) {
        return NextResponse.json(
          {
            error: "Incorrect delivery OTP. Please verify the 4-digit code with the student.",
          },
          { status: 400 }
        );
      }

      // OTP verified successfully: complete order & automatically terminate tracking
      const now = new Date();
      await prisma.$transaction([
        // Update Order
        prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.DELIVERED },
        }),
        // Update Tracking (stop active tracking)
        prisma.deliveryTracking.update({
          where: { orderId: order.id },
          data: {
            status: DeliveryStatus.DELIVERED,
            actualDeliveryTime: now,
            isOtpVerified: true,
            trackingLogs: [
              ...currentLogs,
              {
                event: "DELIVERY_COMPLETED_OTP_VERIFIED",
                otpVerified: true,
                timestamp: now.toISOString(),
                note,
              },
            ],
          },
        }),
        // Mark payment as paid if cash on delivery
        prisma.payment.updateMany({
          where: { orderId: order.id, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.PAID, paidAt: now },
        }),
      ]);

      await sendNotification({
        userId: order.userId,
        type: NotificationType.ORDER_DELIVERED,
        title: "Order Delivered!",
        body: `Your meal #${order.orderNumber} was successfully delivered by ${user.fullName}. Thank you for dining with CoU DineX!`,
        actionUrl: `/orders/${order.id}`,
      });

      return NextResponse.json({
        success: true,
        message: "Delivery handover verified and completed successfully. Live tracking terminated.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("[Delivery Action API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process delivery action." },
      { status: 500 }
    );
  }
}
