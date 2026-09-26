import { PaymentMethod, PaymentGateway } from "./types";
import { CashPaymentGateway } from "./gateways/cash-gateway";
import { SimulatedBkashGateway } from "./gateways/bkash-gateway";
import { SimulatedNagadGateway } from "./gateways/nagad-gateway";
import { SimulatedRocketGateway } from "./gateways/rocket-gateway";
import { SimulatedCardGateway } from "./gateways/card-gateway";

/**
 * Payment Gateway Factory
 *
 * Implements the Strategy / Factory pattern.
 * Enables seamless swap to live payment gateways (e.g. SSLCommerz, Shurjopay,
 * bKash Direct API) when credentials & contracts are established,
 * adhering to clean architecture principles without altering business callers.
 */
class PaymentGatewayFactory {
  private gateways: Map<PaymentMethod, PaymentGateway> = new Map();

  constructor() {
    this.registerGateway(new CashPaymentGateway());
    this.registerGateway(new SimulatedBkashGateway());
    this.registerGateway(new SimulatedNagadGateway());
    this.registerGateway(new SimulatedRocketGateway());
    this.registerGateway(new SimulatedCardGateway());
  }

  public registerGateway(gateway: PaymentGateway): void {
    this.gateways.set(gateway.method, gateway);
  }

  public getGateway(method: PaymentMethod): PaymentGateway {
    const gateway = this.gateways.get(method);
    if (!gateway) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    return gateway;
  }

  public getSupportedMethods(): PaymentMethod[] {
    return Array.from(this.gateways.keys());
  }
}

export const paymentGatewayFactory = new PaymentGatewayFactory();

export function getPaymentGateway(method: PaymentMethod): PaymentGateway {
  return paymentGatewayFactory.getGateway(method);
}
