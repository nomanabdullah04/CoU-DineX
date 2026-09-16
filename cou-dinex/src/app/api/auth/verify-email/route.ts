import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TokenType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    const verificationRecord = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: TokenType.EMAIL_VERIFICATION,
      },
      include: {
        user: true,
      },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    if (new Date() > verificationRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: verificationRecord.id } });
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Clean up used token
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    });

    return NextResponse.json({
      success: true,
      message: "Email address verified successfully!",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying email" },
      { status: 500 }
    );
  }
}
