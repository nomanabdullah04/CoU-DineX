import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDigitalReceipt } from "@/lib/payment/receipt-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.userId && user.role !== "SUPER_ADMIN" && user.role !== "CAFETERIA_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const receipt = await getDigitalReceipt(id);

    if (!receipt) {
      return NextResponse.json({ error: "Receipt could not be generated" }, { status: 404 });
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("[API] GET /api/orders/[id]/receipt error:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}
