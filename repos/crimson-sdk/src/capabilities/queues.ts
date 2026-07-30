export interface QueueStats {
  activeMessageCount: number;
  deadLetterMessageCount: number;
  scheduledMessageCount: number;
  transferMessageCount: number;
  transferDeadLetterMessageCount: number;
  totalMessageCount: number;
  sizeInBytes?: number;
}

export interface QueueRegistry {
  send<T>(binding: string, message: T): Promise<void>;
  stats(binding: string): Promise<QueueStats>;
}
