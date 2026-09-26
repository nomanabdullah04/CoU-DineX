import { PaymentMethod, PaymentStatus, InitiatePaymentParams, InitiatePaymentResult, VerifyPaymentParams, VerifyPaymentResult, RefundPaymentParams, RefundPaymentResult, PaymentStatusResult, PaymentGateway } from "../types";
import { prisma } from "@/lib/prisma";

export abstract class BaseSimulatedGateway implements PaymentGateway {
  abstract readonly method: PaymentMethod;
  abstract readonly displayName: string;
  abstract readonly providerPrefix: string;
  readonly isDemo: boolean = true;

  protected generateDemoTransactionId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DEMO-${this.providerPrefix}-${timestamp}${random}`;
  }

  protected generateReceiptNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(10000 + Math.random() * 90000);
    return `REC-${dateStr}-${random}`;
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const gatewayRef = `REF-${this.providerPrefix}-${Date.now()}`;

    // Upsert or create Payment record in PROCESSING state
    const payment = await prisma.payment.upsert({
      where: { orderId: params.orderId },
      update: {
        method: this.method,
        status: PaymentStatus.PROCESSING,
        amount: params.amount,
        gatewayRef,
        isDemo: true,
      },
      create: {
        orderId: params.orderId,
        method: this.method,
        status: PaymentStatus.PROCESSING,
        amount: params.amount,
        gatewayRef,
        isDemo: true,
      },
    });

    return {
      success: true,
      paymentId: payment.id,
      status: PaymentStatus.PROCESSING,
      isDemo: true,
      demoLabel: "Demo Payment",
      gatewayRef,
      instructions: `This is a simulated ${this.displayName} demo payment for CoU DineX campus evaluation. No real money will be transferred.`,
      demoData: {
        suggestedAccount: "01700000000",
        suggestedOtp: "123456",
        suggestedPin: "1234",
        instructions: "Click 'Complete Demo Payment' to test successful verification, or 'Simulate Failure' to test decline.",
      },
    };
  }

  async verify(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    // Check if the caller requested a simulated failure
    if (params.simulatedOutcome === "FAILED") {
      await prisma.payment.updateMany({
        where: { orderId: params.orderId },
        data: {
          status: PaymentStatus.FAILED,
          rawGatewayResponse: {
            simulation: "Demo payment failure triggered by user test",
            timestamp: new Date().toISOString(),
          },
        },
      });

      return {
        success: false,
        status: PaymentStatus.FAILED,
        isDemo: true,
        errorMessage: "Simulated payment was declined or cancelled (Demo Payment).",
      };
    }

    const transactionId = this.generateDemoTransactionId();
    const receiptNumber = this.generateReceiptNumber();
    const paidAt = new Date();

    // Update payment record in database
    const updated = await prisma.payment.update({
      where: { orderId: params.orderId },
      data: {
        status: PaymentStatus.PAID,
        transactionId,
        receiptNumber,
        paidAt,
        isDemo: true,
        rawGatewayResponse: {
          simulation: "Demo Payment Verification Success",
          method: this.method,
          transactionId,
          receiptNumber,
          paidAt: paidAt.toISOString(),
          verifiedBy: "CoU DineX Simulated Gateway",
          notice: "Demo Payment — No real currency transferred.",
        },
      },
    });

    // Also update order status from PENDING to CONFIRMED
    await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status: "CONFIRMED",
      },
    });

    return {
      success: true,
      status: PaymentStatus.PAID,
      transactionId: updated.transactionId || transactionId,
      receiptNumber: updated.receiptNumber || receiptNumber,
      paidAt,
      isDemo: true,
      rawResponse: {
        method: this.method,
        demoNotice: "Demo Payment Successful",
      },
    };
  }

  async refund(params: RefundPaymentParams): Promise<RefundPaymentResult> {
    const refundTransactionId = `REFUND-${this.providerPrefix}-${Date.now()}`;
    const refundedAt = new Date();

    await prisma.payment.update({
      where: { orderId: params.orderId },
      data: {
        status: PaymentStatus.REFUNDED,
        rawGatewayResponse: {
          refund: true,
          refundTransactionId,
          refundedAt: refundedAt.toISOString(),
          reason: params.reason || "Simulated demo refund",
          refundedBy: params.refundedBy || "System Admin",
          notice: "Demo Payment Refund",
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
