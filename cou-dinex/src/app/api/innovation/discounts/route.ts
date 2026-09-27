import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { STUDENT_DISCOUNT_CONFIG } from "@/lib/innovation-config";

export async function GET(req: NextRequest) {
  try {
    const userSession = await getCurrentUser();

    let isVerifiedStudent = false;
    if (userSession) {
      const student = await prisma.student.findUnique({
        where: { userId: userSession.userId },
      });
      isVerifiedStudent = student?.verificationStatus === "APPROVED";
    }

    const discounts = STUDENT_DISCOUNT_CONFIG.map((discount) => {
      const isEligible = !discount.requiresVerifiedStudent || isVerifiedStudent;
      return {
        ...discount,
        isEligible,
        statusText: isEligible
          ? "Available to Apply"
          : "Requires Verified Student Account",
      };
    });

    return NextResponse.json({
      success: true,
      isVerifiedStudent,
      discounts,
    });
  } catch (error: any) {
    console.error("Fetch discounts failed:", error);
    return NextResponse.json({ error: "Failed to load student discounts" }, { status: 500 });
  }
}
