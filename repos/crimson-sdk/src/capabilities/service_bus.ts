export interface ServiceBusBinding {
  /** Send a JSON message to an Azure Service Bus queue or topic. */
  send<T>(entity: string, message: T): Promise<void>;
}
