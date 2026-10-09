import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, maskPhone } from "@/lib/admin-auth";
import { OrderStatus, DeliveryType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL";
    const deliveryType = searchParams.get("deliveryType") || "ALL";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status !== "ALL" && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }
    if (deliveryType !== "ALL" && Object.values(DeliveryType).includes(deliveryType as DeliveryType)) {
      where.deliveryType = deliveryType as DeliveryType;
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { fullName: true, phone: true, role: true } },
          cafeteria: { select: { name: true } },
          orderItems: {
            include: {
              menuItem: { select: { name: true, price: true } },
            },
          },
          payment: { select: { method: true, status: true, amount: true, transactionId: true } },
          deliveryTracking: {
            select: {
              status: true,
              agent: { include: { user: { select: { fullName: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      deliveryType: o.deliveryType,
      subtotal: Number(o.subtotal),
      deliveryFee: Number(o.deliveryFee),
      discount: Number(o.discount),
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
      user: {
        fullName: o.user.fullName,
        maskedPhone: maskPhone(o.user.phone),
        role: o.user.role,
      },
      cafeteriaName: o.cafeteria.name,
      itemCount: o.orderItems.reduce((acc, it) => acc + it.quantity, 0),
      items: o.orderItems.map((it) => ({
        name: it.menuItem.name,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
      payment: o.payment ? {
        method: o.payment.method,
        status: o.payment.status,
        amount: Number(o.payment.amount),
        transactionId: o.payment.transactionId,
      } : null,
      deliveryAgent: o.deliveryTracking?.agent?.user?.fullName || null,
      deliveryStatus: o.deliveryTracking?.status || null,
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      statusCounts: Object.fromEntries(statusCounts.map((sc) => [sc.status, sc._count.id])),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin Orders API error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
