import { PaymentMethod } from "../types";
import { BaseSimulatedGateway } from "./simulated-base";

export class SimulatedBkashGateway extends BaseSimulatedGateway {
  readonly method = PaymentMethod.BKASH;
  readonly displayName = "Simulated bKash";
  readonly providerPrefix = "BKASH";
}
