import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth";
import { TokenType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Verify token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_RESET,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link" },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        { error: "Password reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    });

    // Delete used token
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
