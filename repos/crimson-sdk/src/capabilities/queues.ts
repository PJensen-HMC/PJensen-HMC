export interface QueueRegistry {
  send<T>(binding: string, message: T): Promise<void>;
}
