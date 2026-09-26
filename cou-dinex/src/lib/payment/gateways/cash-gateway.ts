import {
  PaymentMethod,
  PaymentStatus,
  InitiatePaymentParams,
  InitiatePaymentResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  RefundPaymentParams,
  RefundPaymentResult,
  PaymentStatusResult,
  PaymentGateway,
} from "../types";
import { prisma } from "@/lib/prisma";

export class CashPaymentGateway implements PaymentGateway {
  readonly method = PaymentMethod.CASH_ON_DELIVERY;
  readonly displayName = "Cash";
  readonly isDemo = false;

  private generateReceiptNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(10000 + Math.random() * 90000);
    return `REC-${dateStr}-${random}`;
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const receiptNumber = this.generateReceiptNumber();
    const gatewayRef = `CASH-${Date.now()}`;

    const payment = await prisma.payment.upsert({
      where: { orderId: params.orderId },
      update: {
        method: this.method,
        status: PaymentStatus.PENDING,
        amount: params.amount,
        gatewayRef,
        receiptNumber,
        isDemo: false,
      },
      create: {
        orderId: params.orderId,
        method: this.method,
        status: PaymentStatus.PENDING,
        amount: params.amount,
        gatewayRef,
        receiptNumber,
        isDemo: false,
      },
    });

    return {
      success: true,
      paymentId: payment.id,
      status: PaymentStatus.PENDING,
      isDemo: false,
      demoLabel: "Cash",
      gatewayRef,
      instructions: "Pay at counter upon picking up your order or to the delivery rider.",
    };
  }

  async verify(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const transactionId = `CASH-RECVD-${Date.now()}`;
    const paidAt = new Date();

    const payment = await prisma.payment.findUnique({
      where: { orderId: params.orderId },
    });

    const receiptNumber = payment?.receiptNumber || this.generateReceiptNumber();

    const updated = await prisma.payment.update({
      where: { orderId: params.orderId },
      data: {
        status: PaymentStatus.PAID,
        transactionId,
        receiptNumber,
        paidAt,
        isDemo: false,
        rawGatewayResponse: {
          receivedAt: paidAt.toISOString(),
          channel: "Physical Cash",
        },
      },
    });

    return {
      success: true,
      status: PaymentStatus.PAID,
      transactionId,
      receiptNumber: updated.receiptNumber || receiptNumber,
      paidAt,
      isDemo: false,
    };
  }

  async refund(params: RefundPaymentParams): Promise<RefundPaymentResult> {
    const refundTransactionId = `CASH-REFUND-${Date.now()}`;
    const refundedAt = new Date();

    await prisma.payment.update({
      where: { orderId: params.orderId },
      data: {
        status: PaymentStatus.REFUNDED,
        rawGatewayResponse: {
          refund: true,
          refundTransactionId,
          refundedAt: refundedAt.toISOString(),
          reason: params.reason || "Cash returned at counter",
        },
      },
    });

    return {
      success: true,
      status: PaymentStatus.REFUNDED,
      refundTransactionId,
      refundedAt,
    };
  }

  async checkStatus(paymentId: string): Promise<PaymentStatusResult> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error(`Payment record not found: ${paymentId}`);
    }

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      amount: parseFloat(payment.amount.toString()),
      method: payment.method,
      transactionId: payment.transactionId,
      receiptNumber: payment.receiptNumber,
      paidAt: payment.paidAt,
      isDemo: payment.isDemo,
    };
  }
}
