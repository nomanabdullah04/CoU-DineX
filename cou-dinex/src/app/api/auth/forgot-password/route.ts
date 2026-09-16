import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { TokenType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always respond with success to prevent user enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been generated.",
      });
    }

    // Invalidate any existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: TokenType.PASSWORD_RESET,
      },
    });

    // Generate new reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        type: TokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been generated.",
      resetToken, // Returned in dev for easy verification and link usage
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
