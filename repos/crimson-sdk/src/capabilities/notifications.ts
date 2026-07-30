export interface NotificationPayload {
  name: string;
  metadata?: Record<string, string>;
}

export interface NotificationSendOptions {
  /** Send the event for this user when no authenticated user is available. */
  userId?: string;
}

export interface NotificationsBinding {
  send(
    payload: NotificationPayload,
    options?: NotificationSendOptions,
  ): Promise<void>;
}
