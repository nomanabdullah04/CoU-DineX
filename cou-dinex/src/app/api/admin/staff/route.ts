import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, maskPhone, maskEmail } from "@/lib/admin-auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { error, user } = await requireAdminSession();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role") || "ALL";

    const where: any = {
      role: {
        in: [Role.CAFETERIA_STAFF, Role.CAFETERIA_ADMIN, Role.DELIVERY_AGENT, Role.SUPER_ADMIN],
      },
    };

    if (roleFilter !== "ALL" && Object.values(Role).includes(roleFilter as Role)) {
      where.role = roleFilter as Role;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const staffUsers = await prisma.user.findMany({
      where,
      include: {
        deliveryAgent: {
          select: {
            id: true,
            vehicleType: true,
            isAvailable: true,
            _count: { select: { trackings: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitizedStaff = staffUsers.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      maskedPhone: maskPhone(s.phone),
      maskedEmail: maskEmail(s.email),
      role: s.role,
      isActive: s.isActive,
      createdAt: s.createdAt,
      deliveryAgent: s.deliveryAgent
        ? {
            id: s.deliveryAgent.id,
            vehicleType: s.deliveryAgent.vehicleType,
            isAvailable: s.deliveryAgent.isAvailable,
            completedDeliveries: s.deliveryAgent._count.trackings,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      staff: sanitizedStaff,
    });
  } catch (error) {
    console.error("Admin Staff API error:", error);
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, user: adminUser } = await requireAdminSession();
    if (error) return error;

    const body = await req.json();
    const { fullName, phone, email, role, vehicleType } = body;

    if (!fullName || !phone || !role) {
      return NextResponse.json({ error: "Full name, phone, and role are required" }, { status: 400 });
    }

    // Role safety
    const allowedRoles: Role[] = [Role.CAFETERIA_STAFF, Role.CAFETERIA_ADMIN, Role.DELIVERY_AGENT];
    if (adminUser?.role === Role.SUPER_ADMIN) {
      allowedRoles.push(Role.SUPER_ADMIN);
    }

    if (!allowedRoles.includes(role as Role)) {
      return NextResponse.json({ error: "Invalid role assignment" }, { status: 400 });
    }

    // Check duplicate phone
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "User with this phone number already exists" }, { status: 400 });
    }

    // Default password hash for initial onboarding
    const defaultPasswordHash = "$2a$10$vN0o9o14K0b7mGqW3gY.Qeb9W77u5jE6YyYtTslbI0H7Gf/pC6M2W"; // pass123

    const newStaff = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName,
          phone,
          email: email || null,
          role: role as Role,
          passwordHash: defaultPasswordHash,
          isActive: true,
        },
      });

      if (role === Role.DELIVERY_AGENT) {
        await tx.deliveryAgent.create({
          data: {
            userId: createdUser.id,
            vehicleType: vehicleType || "Bicycle",
            isAvailable: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: adminUser?.userId,
          action: "CREATE",
          entityName: "Staff",
          entityId: createdUser.id,
          newValues: { fullName, phone: maskPhone(phone), role },
        },
      });

      return createdUser;
    });

    return NextResponse.json({ success: true, user: newStaff });
  } catch (err: any) {
    console.error("Create staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to create staff member" }, { status: 500 });
  }
}
