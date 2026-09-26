import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Role, OrderStatus, DeliveryStatus, DeliveryType } from "@prisma/client";

export async function GET(req: NextRequest) {
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

    // Find delivery agent profile
    let agent = await prisma.deliveryAgent.findUnique({
      where: { userId: user.userId },
    });

    // If admin or agent doesn't have profile yet, create/fetch default
    if (!agent) {
      agent = await prisma.deliveryAgent.create({
        data: {
          userId: user.userId,
          vehicleType: "Motorbike / Campus Bicycle",
          licenseNumber: "COU-DL-2026-DEFAULT",
          isAvailable: true,
        },
      });
    }

    // 1. Active Deliveries assigned to this agent (not yet DELIVERED or FAILED)
    const activeDeliveries = await prisma.order.findMany({
      where: {
        deliveryTracking: {
          agentId: agent.id,
          status: {
            in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.ON_THE_WAY, DeliveryStatus.ARRIVED],
          },
        },
      },
      include: {
        user: { select: { fullName: true, phone: true } },
        cafeteria: { select: { name: true, location: true } },
        deliveryLocation: {
          include: {
            hall: { select: { name: true, code: true } },
            department: { select: { name: true, code: true } },
          },
        },
        orderItems: {
          include: { menuItem: { select: { name: true, imageUrl: true } } },
        },
        payment: { select: { method: true, status: true, amount: true } },
        deliveryTracking: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Available Campus Delivery Orders needing a rider (ready or preparing, not yet assigned)
    const availableOrders = await prisma.order.findMany({
      where: {
        deliveryType: {
          in: [DeliveryType.HALL_DELIVERY, DeliveryType.DEPARTMENT_DELIVERY],
        },
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP],
        },
        deliveryTracking: {
          OR: [
            { agentId: null },
            { status: DeliveryStatus.PENDING },
          ],
        },
      },
      include: {
        user: { select: { fullName: true, phone: true } },
        cafeteria: { select: { name: true, location: true } },
        deliveryLocation: {
          include: {
            hall: { select: { name: true, code: true } },
            department: { select: { name: true, code: true } },
          },
        },
        orderItems: {
          include: { menuItem: { select: { name: true, imageUrl: true } } },
        },
        payment: { select: { method: true, status: true, amount: true } },
        deliveryTracking: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. Completed deliveries by this agent (last 20)
    const completedDeliveries = await prisma.order.findMany({
      where: {
        deliveryTracking: {
          agentId: agent.id,
          status: DeliveryStatus.DELIVERED,
        },
      },
      include: {
        user: { select: { fullName: true, phone: true } },
        cafeteria: { select: { name: true } },
        deliveryLocation: {
          include: {
            hall: { select: { name: true, code: true } },
            department: { select: { name: true, code: true } },
          },
        },
        payment: { select: { method: true, status: true, amount: true } },
        deliveryTracking: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: user.fullName,
        phone: user.phone,
        vehicleType: agent.vehicleType,
        licenseNumber: agent.licenseNumber,
        isAvailable: agent.isAvailable,
      },
      activeDeliveries,
      availableOrders,
      completedDeliveries,
    });
  } catch (error) {
    console.error("[Delivery Orders API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery orders" },
      { status: 500 }
    );
  }
}
