import { PaymentMethod } from "../types";
import { BaseSimulatedGateway } from "./simulated-base";

export class SimulatedCardGateway extends BaseSimulatedGateway {
  readonly method = PaymentMethod.CARD;
  readonly displayName = "Simulated Card";
  readonly providerPrefix = "CARD";
}
