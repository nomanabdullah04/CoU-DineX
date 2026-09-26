import { PaymentMethod, PaymentStatus } from "@prisma/client";

export { PaymentMethod, PaymentStatus };

export interface PaymentMethodConfig {
  method: PaymentMethod;
  name: string;
  isDemo: boolean;
  demoBadge: string;
  description: string;
  iconName: string;
  color: string;
}

export const PAYMENT_METHOD_CONFIGS: Record<PaymentMethod, PaymentMethodConfig> = {
  [PaymentMethod.CASH_ON_DELIVERY]: {
    method: PaymentMethod.CASH_ON_DELIVERY,
    name: "Cash",
    isDemo: false,
    demoBadge: "Standard Cash",
    description: "Pay directly at the cafeteria counter or upon delivery",
    iconName: "Banknote",
    color: "#0F766E",
  },
  [PaymentMethod.BKASH]: {
    method: PaymentMethod.BKASH,
    name: "Simulated bKash",
    isDemo: true,
    demoBadge: "Demo Payment",
    description: "Simulated bKash mobile financial service for campus testing",
    iconName: "Smartphone",
    color: "#E2136E",
  },
  [PaymentMethod.NAGAD]: {
    method: PaymentMethod.NAGAD,
    name: "Simulated Nagad",
    isDemo: true,
    demoBadge: "Demo Payment",
    description: "Simulated Nagad mobile financial service for campus testing",
    iconName: "Zap",
    color: "#F7941D",
  },
  [PaymentMethod.ROCKET]: {
    method: PaymentMethod.ROCKET,
    name: "Simulated Rocket",
    isDemo: true,
    demoBadge: "Demo Payment",
    description: "Simulated DBBL Rocket mobile wallet for campus testing",
    iconName: "Rocket",
    color: "#8C3494",
  },
  [PaymentMethod.CARD]: {
    method: PaymentMethod.CARD,
    name: "Simulated Card",
    isDemo: true,
    demoBadge: "Demo Payment",
    description: "Simulated Visa / Mastercard debit & credit card payment",
    iconName: "CreditCard",
    color: "#2563EB",
  },
  [PaymentMethod.WALLET]: {
    method: PaymentMethod.WALLET,
    name: "DineX Wallet",
    isDemo: true,
    demoBadge: "Demo Payment",
    description: "Student campus dining balance wallet",
    iconName: "Wallet",
    color: "#0D9488",
  },
};

export interface InitiatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  returnUrl?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  isDemo: boolean;
  demoLabel: string;
  gatewayRef: string;
  checkoutUrl?: string;
  instructions?: string;
  demoData?: {
    suggestedAccount?: string;
    suggestedOtp?: string;
    suggestedPin?: string;
    instructions: string;
  };
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  gatewayRef?: string;
  demoAccount?: string;
  demoPin?: string;
  simulatedOutcome?: "SUCCESS" | "FAILED";
}

export interface VerifyPaymentResult {
  success: boolean;
  status: PaymentStatus;
  transactionId?: string;
  receiptNumber?: string;
  paidAt?: Date;
  isDemo: boolean;
  errorMessage?: string;
  rawResponse?: Record<string, unknown>;
}

export interface RefundPaymentParams {
  orderId: string;
  paymentId: string;
  amount?: number;
  reason?: string;
  refundedBy?: string;
}

export interface RefundPaymentResult {
  success: boolean;
  status: PaymentStatus;
  refundTransactionId: string;
  refundedAt: Date;
  errorMessage?: string;
}

export interface PaymentStatusResult {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  method: PaymentMethod;
  transactionId?: string | null;
  receiptNumber?: string | null;
  paidAt?: Date | null;
  isDemo: boolean;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string | null;
}

export interface DigitalReceiptData {
  receiptNumber: string;
  appName: string;
  campusName: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  paidAt: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerRole: string;
  cafeteriaName: string;
  deliveryType: string;
  destinationDisplay: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentMethodRaw: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId: string | null;
  isDemo: boolean;
  demoNotice: string | null;
}

export interface PaymentGateway {
  readonly method: PaymentMethod;
  readonly isDemo: boolean;
  readonly displayName: string;
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verify(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  refund(params: RefundPaymentParams): Promise<RefundPaymentResult>;
  checkStatus(paymentId: string): Promise<PaymentStatusResult>;
}
