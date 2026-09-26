import { PaymentMethod } from "../types";
import { BaseSimulatedGateway } from "./simulated-base";

export class SimulatedNagadGateway extends BaseSimulatedGateway {
  readonly method = PaymentMethod.NAGAD;
  readonly displayName = "Simulated Nagad";
  readonly providerPrefix = "NAGAD";
}
