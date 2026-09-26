import { PaymentMethod } from "../types";
import { BaseSimulatedGateway } from "./simulated-base";

export class SimulatedRocketGateway extends BaseSimulatedGateway {
  readonly method = PaymentMethod.ROCKET;
  readonly displayName = "Simulated Rocket";
  readonly providerPrefix = "ROCKET";
}
