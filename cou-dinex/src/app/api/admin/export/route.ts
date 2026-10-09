import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "orders"; // orders, revenue, inventory, users, complaints
    const format = searchParams.get("format") || "csv"; // csv, json

    if (type === "orders") {
      const orders = await prisma.order.findMany({
        take: 500,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { fullName: true, phone: true } },
          payment: { select: { method: true, status: true, transactionId: true } },
        },
      });

      if (format === "csv") {
        const headers = ["Order Number", "Date", "Status", "Delivery Type", "Customer", "Subtotal", "Delivery Fee", "Total Amount", "Payment Method", "Payment Status"];
        const rows = orders.map((o) => [
          o.orderNumber,
          o.createdAt.toISOString().slice(0, 10),
          o.status,
          o.deliveryType,
          `"${o.user.fullName.replace(/"/g, '""')}"`,
          Number(o.subtotal),
          Number(o.deliveryFee),
          Number(o.totalAmount),
          o.payment?.method || "—",
          o.payment?.status || "—",
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="cou_dinex_orders_export_${Date.now()}.csv"`,
          },
        });
      }

      return NextResponse.json({ success: true, count: orders.length, data: orders });
    }

    if (type === "inventory") {
      const items = await prisma.inventory.findMany({
        include: {
          menuItem: { select: { name: true, price: true } },
          cafeteria: { select: { name: true } },
        },
      });

      if (format === "csv") {
        const headers = ["Item Name", "Cafeteria", "Price", "Current Stock", "Daily Starting Stock", "Low Stock Threshold", "Sold Out"];
        const rows = items.map((i) => [
          `"${i.menuItem.name.replace(/"/g, '""')}"`,
          `"${i.cafeteria.name.replace(/"/g, '""')}"`,
          Number(i.menuItem.price),
          i.currentStock,
          i.dailyStartingStock,
          i.lowStockThreshold,
          i.isSoldOut ? "YES" : "NO",
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="cou_dinex_inventory_export_${Date.now()}.csv"`,
          },
        });
      }

      return NextResponse.json({ success: true, count: items.length, data: items });
    }

    return NextResponse.json({ error: "Unsupported export type" }, { status: 400 });
  } catch (err: any) {
    console.error("Export API error:", err);
    return NextResponse.json({ error: "Failed to generate export file" }, { status: 500 });
  }
}
